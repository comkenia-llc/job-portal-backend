const { CompanySubscription, CandidateSubscription, Plan, Company, User } = require("../models");
const { Op } = require("sequelize");
const bcrypt = require("bcrypt");
const { nanoid } = require("nanoid");
const { assignDefaultEmployerPlan } = require("../services/employerPlanService");
const { resolveRequestMarket, applyMarketScope } = require("../utils/market");
const { getCurrencyForMarket } = require("../utils/marketCatalog");
const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret ? require("stripe")(stripeSecret) : null;

const normalizeStripeKeyPart = (value = "") =>
    String(value || "")
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

const buildStripeKeyCandidates = (plan) => {
    if (!plan) return [];

    const slug = normalizeStripeKeyPart(plan.slug);
    const name = normalizeStripeKeyPart(plan.name);
    const audience = normalizeStripeKeyPart(plan.audience);
    const rawCandidates = [
        slug,
        name,
        slug && audience ? `${audience}_${slug}` : "",
        name && audience ? `${audience}_${name}` : "",
    ].filter(Boolean);

    return [...new Set(rawCandidates)];
};

const resolvePriceId = (plan, billingCycle = "monthly") => {
    const candidates = buildStripeKeyCandidates(plan);
    if (!candidates.length) return null;
    const suffix = billingCycle === "yearly" ? "_YEARLY" : "_MONTHLY";

    for (const candidate of candidates) {
        const primaryKey = `STRIPE_PRICE_${candidate}${suffix}`;
        if (process.env[primaryKey]) return process.env[primaryKey];
    }

    // Legacy/fallback: no cycle suffix (treated as monthly)
    if (billingCycle === "monthly") {
        for (const candidate of candidates) {
            const legacyKey = `STRIPE_PRICE_${candidate}`;
            if (process.env[legacyKey]) return process.env[legacyKey];
        }
    }

    return null;
};

const frontendBase =
    process.env.FRONTEND_URL ||
    process.env.NEXT_PUBLIC_FRONT_URL ||
    "http://localhost:3000";

const resolvePlanWhere = (slug, audience, market) => {
    const where = {
        slug,
        ...(audience ? { audience } : {}),
    };

    if (!market || market === "global") {
        where.market = "global";
        return where;
    }

    where.market = {
        [Op.in]: [market, "global"],
    };
    return where;
};

const resolvePlanBySlug = async ({ slug, audience, market }) => {
    if (!slug) return null;

    const plans = await Plan.findAll({
        where: resolvePlanWhere(slug, audience, market),
        order: [["id", "ASC"]],
    });

    if (!plans.length) return null;
    return plans.find((plan) => plan.market === market) || plans[0];
};

// ============================
// 🟢 Admin: Assign/Subscribe Plan to Company
// ============================
exports.createSubscription = async (req, res) => {
    try {
        const { company_id, plan_id, start_date, end_date, renewal_method, payment_method, payment_reference, notes } =
            req.body;

        const [company, plan] = await Promise.all([
            Company.findByPk(company_id, { attributes: ["id", "name", "market"] }),
            Plan.findByPk(plan_id, { attributes: ["id", "name", "market", "audience"] }),
        ]);

        if (!company) {
            return res.status(404).json({ message: "Company not found" });
        }
        if (!plan) {
            return res.status(404).json({ message: "Plan not found" });
        }
        if (plan.audience && plan.audience !== "employer") {
            return res.status(400).json({ message: "Only employer plans can be assigned to companies" });
        }
        if (plan.market !== "global" && company.market && plan.market !== company.market) {
            return res.status(400).json({ message: "Selected plan does not match the company's market" });
        }

        const scopedCompanyWhere = applyMarketScope({ id: company_id }, req, {
            allowAdminOverride: true,
            allowExplicitOverride: true,
            allowAllForAdmin: true,
        });
        const scopedCompany = await Company.findOne({
            where: scopedCompanyWhere,
            attributes: ["id"],
        });
        if (!scopedCompany) {
            return res.status(404).json({ message: "Company is not available in the selected market" });
        }

        const subscription = await CompanySubscription.create({
            company_id,
            plan_id,
            start_date,
            end_date,
            renewal_method,
            payment_method,
            payment_reference,
            notes,
            status: "active",
        });

        res.status(201).json(subscription);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: "Failed to create subscription", error: error.message });
    }
};

// ============================
// 🟢 Admin: Get All Subscriptions (optional filters)
// ============================
exports.getAllSubscriptions = async (req, res) => {
    try {
        const where = {};
        if (req.query.status) where.status = req.query.status;
        const resolvedMarket = resolveRequestMarket(req, {
            allowAdminOverride: true,
            allowExplicitOverride: true,
            allowAllForAdmin: true,
        }).market;

        const subscriptions = await CompanySubscription.findAll({
            where,
            include: [
                { model: Plan, attributes: ["id", "name", "price_monthly", "slug", "market", "currency"] },
                {
                    model: Company,
                    attributes: ["id", "name", "email", "market"],
                    ...(resolvedMarket ? { where: { market: resolvedMarket } } : {}),
                },
            ],
            order: [["id", "DESC"]],
        });

        res.json(subscriptions);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch subscriptions", error: error.message });
    }
};

// ============================
// 🧾 Company: Get Current Subscription
// ============================
exports.getCompanySubscription = async (req, res) => {
    try {
        const companyId = req.user.companyId; // assuming companyId is attached after auth
        console.log("🧭 [SUBSCRIPTION] user context:", {
            userId: req.user?.id,
            role: req.user?.role,
            companyId,
        });

        // Admins are not blocked by subscription; return a neutral payload
        if (req.user.role === "admin" && !companyId) {
            console.log("ℹ️ [SUBSCRIPTION] Admin bypass (no company linked).");
            return res.json({ status: "admin-bypass" });
        }

        if (!companyId) {
            console.warn("⚠️ [SUBSCRIPTION] No company linked to this account.");
            return res.status(404).json({ message: "No company linked to this account" });
        }

        let subscription = await CompanySubscription.findOne({
            where: {
                company_id: companyId,
                status: "active",
                end_date: {
                    [Op.or]: [{ [Op.gt]: new Date() }, { [Op.is]: null }],
                },
            },
            include: [{ model: Plan, attributes: ["id", "name", "features", "price_monthly", "price_yearly", "currency", "description", "slug"] }],
        });

        if (!subscription && req.user.role === "employer") {
            await assignDefaultEmployerPlan(companyId);
            subscription = await CompanySubscription.findOne({
                where: {
                    company_id: companyId,
                    status: "active",
                    end_date: {
                        [Op.or]: [{ [Op.gt]: new Date() }, { [Op.is]: null }],
                    },
                },
                include: [{ model: Plan, attributes: ["id", "name", "features", "price_monthly", "price_yearly", "currency", "description", "slug"] }],
            });
        }

        if (!subscription || !subscription.Plan) {
            return res.status(404).json({ message: "No active plan found for this company." });
        }

        res.json({
            plan_id: subscription.Plan?.id || null,
            plan: subscription.Plan?.name || null,
            plan_slug: subscription.Plan?.slug || null,
            plan_description: subscription.Plan?.description || null,
            plan_price_monthly: subscription.Plan?.price_monthly ?? null,
            plan_price_yearly: subscription.Plan?.price_yearly ?? null,
            plan_currency: subscription.Plan?.currency || null,
            features: subscription.Plan?.features || {},
            start_date: subscription.start_date,
            end_date: subscription.end_date,
            renewal_method: subscription.renewal_method,
            status: subscription.status,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch company subscription", error: error.message });
    }
};

// ============================
// 🟢 Employer/Admin: Subscribe company to a plan
// ============================
exports.subscribeSelf = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { plan_id, renewal_method = "manual" } = req.body;

        if (!companyId) {
            return res.status(400).json({ message: "No company linked to this account" });
        }
        if (!plan_id) {
            return res.status(400).json({ message: "plan_id is required" });
        }

        // Ensure plan exists
        const requestedMarket = resolveRequestMarket(req, {
            allowAdminOverride: true,
            allowExplicitOverride: true,
            allowAllForAdmin: true,
        }).market;
        const plan = await Plan.findOne({
            where: {
                id: plan_id,
                ...(requestedMarket ? { market: { [Op.in]: [requestedMarket, "global"] } } : {}),
            },
        });
        if (!plan) return res.status(404).json({ message: "Plan not found" });

        // Prevent duplicate active sub
        const existing = await CompanySubscription.findOne({
            where: {
                company_id: companyId,
                status: "active",
                end_date: {
                    [Op.or]: [{ [Op.gt]: new Date() }, { [Op.is]: null }],
                },
            },
        });
        if (existing) {
            return res.status(409).json({ message: "Company already has an active subscription" });
        }

        const subscription = await CompanySubscription.create({
            company_id: companyId,
            plan_id,
            start_date: new Date(),
            end_date: null,
            renewal_method,
            status: "active",
        });

        res.status(201).json(subscription);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: "Failed to subscribe", error: error.message });
    }
};

// ============================
// 🟡 Admin / Company: Cancel Subscription
// ============================
exports.cancelSubscription = async (req, res) => {
    try {
        const { id } = req.params;
        const subscription = await CompanySubscription.findByPk(id);
        if (!subscription) return res.status(404).json({ message: "Subscription not found" });

        await subscription.update({ status: "canceled" });
        res.json({ message: "Subscription canceled successfully" });
    } catch (error) {
        res.status(400).json({ message: "Failed to cancel subscription", error: error.message });
    }
};

// ============================
// 🧾 Employer/Admin: Create Stripe Checkout Session
// ============================
exports.createCheckoutSession = async (req, res) => {
    try {
        if (!stripe) {
            return res.status(500).json({ message: "Stripe is not configured" });
        }
        const companyId = req.user.companyId;
        if (!companyId && req.user.role !== "admin") {
            return res.status(400).json({ message: "No company linked to this account" });
        }

        const requestedMarket = resolveRequestMarket(req, {
            allowExplicitOverride: true,
        }).market;
        const { plan_slug, success_url, cancel_url, billing_cycle = "monthly" } = req.body;
        if (!plan_slug) return res.status(400).json({ message: "plan_slug is required" });

        const plan = await resolvePlanBySlug({
            slug: plan_slug,
            audience: "employer",
            market: requestedMarket,
        });
        if (!plan) return res.status(404).json({ message: "Plan not found" });

        const priceId = resolvePriceId(plan, billing_cycle);
        if (!priceId) {
            return res
                .status(400)
                .json({ message: `Missing Stripe price for plan ${plan.slug} (${billing_cycle})` });
        }

        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            payment_method_types: ["card"],
            customer_email: req.user.email,
            success_url:
                success_url || `${frontendBase}/subscriptions?stripe=success&plan=${plan.slug}`,
            cancel_url: cancel_url || `${frontendBase}/pricing?stripe=cancel`,
            metadata: {
                userId: req.user.id,
                companyId: companyId || "",
                planId: plan.id,
                planSlug: plan.slug,
                market: plan.market || requestedMarket || "global",
                billingCycle: billing_cycle,
            },
            subscription_data: {
                metadata: {
                    userId: req.user.id,
                    companyId: companyId || "",
                    planId: plan.id,
                    planSlug: plan.slug,
                    market: plan.market || requestedMarket || "global",
                    billingCycle: billing_cycle,
                },
            },
        });

        return res.json({ url: session.url });
    } catch (error) {
        console.error("❌ [Stripe Checkout] Error:", error);
        if (!res.headersSent) {
            res.status(400).json({ message: error.message || "Failed to create checkout session" });
        }
    }
};

// ============================
// 🧾 Candidate: Create Stripe Checkout Session (no auth required)
// ============================
exports.createCandidateCheckoutSession = async (req, res) => {
    try {
        if (!stripe) return res.status(500).json({ message: "Stripe is not configured" });
        const requestedMarket = resolveRequestMarket(req, {
            allowExplicitOverride: true,
        }).market;
        const { plan_slug, success_url, cancel_url, billing_cycle = "monthly" } = req.body;
        if (!plan_slug) {
            return res.status(400).json({ message: "plan_slug is required" });
        }

        let plan = await resolvePlanBySlug({
            slug: plan_slug,
            audience: "candidate",
            market: requestedMarket,
        });
        if (!plan) {
            plan = await Plan.create({
                name: plan_slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
                slug: plan_slug,
                market: requestedMarket || "global",
                audience: "candidate",
                price_monthly: 0,
                currency: getCurrencyForMarket(requestedMarket || "global"),
                duration_type: "monthly",
                features: {},
                description: "Auto-created from checkout",
            });
        }

        const priceId = resolvePriceId(plan, billing_cycle);
        if (!priceId) {
            return res
                .status(400)
                .json({ message: `Missing Stripe price for plan ${plan.slug} (${billing_cycle})` });
        }

        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            line_items: [{ price: priceId, quantity: 1 }],
            payment_method_types: ["card"],
            customer_email: req.user?.email || undefined,
            success_url: success_url || `${frontendBase}/subscriptions?stripe=success&role=candidate&plan=${plan.slug}`,
            cancel_url: cancel_url || `${frontendBase}/pricing?stripe=cancel&role=candidate`,
            metadata: {
                role: "candidate",
                userId: req.user?.id || "",
                planId: plan.id,
                planSlug: plan.slug,
                market: plan.market || requestedMarket || "global",
                billingCycle: billing_cycle,
            },
            subscription_data: {
                metadata: {
                    role: "candidate",
                    userId: req.user?.id || "",
                    planId: plan.id,
                    planSlug: plan.slug,
                    market: plan.market || requestedMarket || "global",
                    billingCycle: billing_cycle,
                },
            },
        });

        return res.json({ url: session.url });
    } catch (error) {
        console.error("❌ [Stripe Candidate Checkout] Error:", error);
        if (!res.headersSent) {
            return res.status(400).json({ message: error.message || "Failed to create checkout session" });
        }
        return;
    }
};

// ============================
// 👤 Candidate: Get active subscription
// ============================
exports.getCandidateSubscription = async (req, res) => {
    try {
        const subscription = await CandidateSubscription.findOne({
            where: {
                user_id: req.user.id,
                status: "active",
                end_date: {
                    [Op.or]: [{ [Op.gt]: new Date() }, { [Op.is]: null }],
                },
            },
            include: [{ model: Plan, attributes: ["id", "name", "features", "price_monthly", "slug"] }],
        });

        if (!subscription) {
            return res.status(404).json({ message: "No active plan found." });
        }

        res.json({
            plan: subscription.Plan.name,
            features: subscription.Plan.features,
            start_date: subscription.start_date,
            end_date: subscription.end_date,
            renewal_method: subscription.renewal_method,
            status: subscription.status,
            payment_reference: subscription.payment_reference,
            stripe_subscription_id: subscription.stripe_subscription_id,
        });
    } catch (error) {
        console.error("❌ [Candidate Subscription] Error:", error);
        res.status(500).json({ message: "Failed to fetch subscription", error: error.message });
    }
};

// ============================
// ⚡ Stripe Webhook: Activate subscription
// ============================
exports.stripeWebhook = async (req, res) => {
    if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
    }

    const sig = req.headers["stripe-signature"];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error("❌ [Stripe Webhook] Signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const meta = session.metadata || {};
        const planId = meta.planId;
        const planSlug = meta.planSlug;
        const companyId = meta.companyId;
        const market = meta.market || null;
        const role = meta.role || (companyId ? "employer" : "candidate");

        try {
            let plan = null;
            if (planId) plan = await Plan.findByPk(planId);
            if (!plan && planSlug) {
                plan = await resolvePlanBySlug({
                    slug: planSlug,
                    audience: role === "candidate" ? "candidate" : "employer",
                    market,
                });
            }
            if (!plan && planSlug) {
                plan = await Plan.create({
                    name: planSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
                    slug: planSlug,
                    market: market || "global",
                    audience: role === "candidate" ? "candidate" : "employer",
                    price_monthly: 0,
                    currency: getCurrencyForMarket(market || "global"),
                    duration_type: "monthly",
                    features: {},
                    description: "Auto-created from checkout (webhook)",
                });
            }
            if (!plan) {
                console.warn("⚠️ [Stripe Webhook] Plan not found for subscription");
                return res.json({ received: true });
            }

            const paymentRef = session.subscription || session.id;
            const stripeCustomerId = session.customer || session.customer_details?.id || null;
            const email = session.customer_details?.email || session.customer_email;

            if (role === "candidate") {
                if (!email) {
                    console.warn("⚠️ [Stripe Webhook] No email for candidate session");
                    return res.json({ received: true });
                }

                let user = await User.findOne({ where: { email } });
                if (!user) {
                    const usernameBase = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "").slice(0, 12) || "candidate";
                    const username = `${usernameBase}-${nanoid(5)}`;
                    const passwordPlain = nanoid(12);
                    const passwordHash = await bcrypt.hash(passwordPlain, 10);
                    user = await User.create({
                        username,
                        email,
                        passwordHash,
                        role: "candidate",
                        status: "active",
                    });
                    console.log("🆕 [Stripe Webhook] Created candidate user from checkout:", user.id);
                }

                const existing = await CandidateSubscription.findOne({
                    where: {
                        user_id: user.id,
                        status: "active",
                        end_date: {
                            [Op.or]: [{ [Op.gt]: new Date() }, { [Op.is]: null }],
                        },
                    },
                });

                if (existing) {
                    await existing.update({
                        plan_id: plan.id,
                        start_date: new Date(),
                        end_date: null,
                        renewal_method: "auto",
                        payment_method: "stripe",
                        payment_reference: paymentRef,
                        stripe_customer_id: stripeCustomerId,
                        stripe_subscription_id: session.subscription || null,
                        status: "active",
                    });
                } else {
                    await CandidateSubscription.create({
                        user_id: user.id,
                        plan_id: plan.id,
                        start_date: new Date(),
                        end_date: null,
                        renewal_method: "auto",
                        payment_method: "stripe",
                        payment_reference: paymentRef,
                        stripe_customer_id: stripeCustomerId,
                        stripe_subscription_id: session.subscription || null,
                        status: "active",
                    });
                }
            } else {
                if (!companyId) {
                    console.warn("⚠️ [Stripe Webhook] Missing companyId in metadata");
                    return res.json({ received: true });
                }

                const existing = await CompanySubscription.findOne({
                    where: {
                        company_id: companyId,
                        status: "active",
                        end_date: {
                            [Op.or]: [{ [Op.gt]: new Date() }, { [Op.is]: null }],
                        },
                    },
                });

                if (existing) {
                    await existing.update({
                        plan_id: plan.id,
                        start_date: new Date(),
                        end_date: null,
                        renewal_method: "auto",
                        payment_method: "stripe",
                        payment_reference: paymentRef,
                        status: "active",
                    });
                } else {
                    await CompanySubscription.create({
                        company_id: companyId,
                        plan_id: plan.id,
                        start_date: new Date(),
                        end_date: null,
                        renewal_method: "auto",
                        payment_method: "stripe",
                        payment_reference: paymentRef,
                        status: "active",
                    });
                }
            }
        } catch (err) {
            console.error("❌ [Stripe Webhook] Failed to persist subscription", err);
            return res.status(500).json({ message: "Failed to process webhook" });
        }
    }

    res.json({ received: true });
};
