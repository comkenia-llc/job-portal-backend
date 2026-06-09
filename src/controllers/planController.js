const { Plan, Feature } = require("../models");
const { Op } = require("sequelize");

const resolveStripeEnvKeys = (slug, cycle = "monthly") => {
    if (!slug) return [];
    const normalized = slug.toUpperCase().replace(/-/g, "_");
    const suffix = cycle === "yearly" ? "_YEARLY" : "_MONTHLY";
    const keys = [`STRIPE_PRICE_${normalized}${suffix}`];
    // Legacy fallback: no suffix for monthly
    if (cycle === "monthly") {
        keys.push(`STRIPE_PRICE_${normalized}`);
    }
    return keys;
};

const stripeAvailability = (slug) => {
    const monthlyKeys = resolveStripeEnvKeys(slug, "monthly");
    const yearlyKeys = resolveStripeEnvKeys(slug, "yearly");
    return {
        stripe_monthly_ready: monthlyKeys.some((k) => process.env[k]),
        stripe_yearly_ready: yearlyKeys.some((k) => process.env[k]),
    };
};

const hasAudienceColumn = () => Boolean(Plan.rawAttributes && Plan.rawAttributes.audience);

// Normalize features that may have been double-encoded (e.g., stored as { "0": "{", "1": "\"", ... })
const normalizeFeatures = (raw) => {
    if (!raw) return raw;

    const decodeCharMap = (obj) => {
        const keys = Object.keys(obj || {});
        if (keys.length === 0) return null;
        if (!keys.every((k) => /^\d+$/.test(k))) return null;
        const sorted = keys.map(Number).sort((a, b) => a - b);
        const str = sorted.map((k) => obj[String(k)]).join("");
        return str;
    };

    // If it's a string, try to parse JSON
    if (typeof raw === "string") {
        try {
            return JSON.parse(raw);
        } catch {
            return raw;
        }
    }

    // If it's an object, try decoding numeric-char maps even if extra keys exist
    if (typeof raw === "object") {
        const entries = Object.entries(raw || {});
        const charMap = entries.filter(([k]) => /^\d+$/.test(k));
        const nonNumeric = Object.fromEntries(entries.filter(([k]) => !/^\d+$/.test(k)));

        if (charMap.length > 0) {
            const sorted = charMap
                .map(([k, v]) => [Number(k), v])
                .sort((a, b) => a[0] - b[0]);
            const str = sorted.map(([, v]) => v).join("");
            let decodedObj = {};
            try {
                decodedObj = JSON.parse(str);
            } catch {
                // if parse fails, keep decoded string as-is
                decodedObj = str;
            }

            // Merge decoded content with non-numeric keys, numeric keys are dropped
            if (decodedObj && typeof decodedObj === "object") {
                return { ...decodedObj, ...nonNumeric };
            }
            return decodedObj;
        }

        return nonNumeric;
    }

    return raw;
};

// =======================
// 🟢 Admin: Create Plan
// =======================
exports.createPlan = async (req, res) => {
    try {
        const {
            name,
            slug,
            audience = "employer",
            price_monthly,
            price_yearly,
            currency,
            duration_type,
            features,
            description,
            ribbon_text,
            ribbon_color,
            ribbon_text_color,
        } = req.body;

        const plan = await Plan.create({
            name,
            slug,
            audience,
            price_monthly,
            price_yearly,
            currency,
            duration_type,
            features,
            description,
            ribbon_text,
            ribbon_color,
            ribbon_text_color,
        });

        return res.status(201).json({
            ...plan.toJSON(),
            ...stripeAvailability(slug),
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: "Failed to create plan", error: error.message });
    }
};

// =======================
// 📋 Admin: Get All Plans
// =======================
exports.getAllPlans = async (_req, res) => {
    try {
        const audienceSupported = hasAudienceColumn();
        const where = {};
        if (audienceSupported && _req.query?.audience) {
            where[Op.or] = [{ audience: _req.query.audience }, { audience: null }];
        }

        const plansRaw = await Plan.findAll({
            attributes: [
                "id",
                "name",
                "slug",
                ...(audienceSupported ? ["audience"] : []),
                "price_monthly",
                "price_yearly",
                "currency",
                "duration_type",
                "features",
                "description",
                "ribbon_text",
                "ribbon_color",
                "ribbon_text_color",
                "is_active",
                "createdAt",
                "updatedAt",
            ],
            where,
            order: [["price_monthly", "ASC"]],
        });
        const plans = plansRaw.map((p) => {
            const plain = p.toJSON();
            return {
                ...plain,
                features: normalizeFeatures(plain.features),
                ...stripeAvailability(p.slug),
            };
        });
        res.json(plans);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch plans", error: error.message });
    }
};

// =======================
// 🌐 Public: List plans (for employer signup/upgrade)
// =======================
exports.listPublicPlans = async (_req, res) => {
    try {
        const audienceSupported = hasAudienceColumn();
        const where = {};
        if (audienceSupported && _req.query?.audience) {
            where[Op.or] = [{ audience: _req.query.audience }, { audience: null }];
        }

        const plansRaw = await Plan.findAll({
            attributes: [
                "id",
                "name",
                "slug",
                ...(audienceSupported ? ["audience"] : []),
                "price_monthly",
                "price_yearly",
                "currency",
                "duration_type",
                "features",
                "description",
                "ribbon_text",
                "ribbon_color",
                "ribbon_text_color",
            ],
            where,
            order: [["price_monthly", "ASC"]],
        });
        const plans = plansRaw.map((p) => {
            const plain = p.toJSON();
            return {
                ...plain,
                features: normalizeFeatures(plain.features),
                ...stripeAvailability(p.slug),
            };
        });
        res.json(plans);
    } catch (error) {
        console.error("❌ Failed to fetch public plans:", error);
        res.status(500).json({ message: "Failed to fetch plans", error: error.message });
    }
};

// =======================
// 🔍 Get Single Plan by ID
// =======================
exports.getPlanById = async (req, res) => {
    try {
        const { id } = req.params;
        const plan = await Plan.findByPk(id);
        if (!plan) return res.status(404).json({ message: "Plan not found" });
        res.json(plan);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch plan", error: error.message });
    }
};

// =======================
// ✏️ Update Plan
// =======================
exports.updatePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const plan = await Plan.findByPk(id);
        if (!plan) return res.status(404).json({ message: "Plan not found" });

        await plan.update(req.body);
        res.json(plan);
    } catch (error) {
        res.status(400).json({ message: "Failed to update plan", error: error.message });
    }
};

// =======================
// ❌ Delete Plan
// =======================
exports.deletePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const plan = await Plan.findByPk(id);
        if (!plan) return res.status(404).json({ message: "Plan not found" });

        await plan.destroy();
        res.json({ message: "Plan deleted successfully" });
    } catch (error) {
        res.status(400).json({ message: "Failed to delete plan", error: error.message });
    }
};

// =======================
// 🧠 Admin Helper: Get Feature Metadata
// =======================
exports.getFeatureDefinitions = async (req, res) => {
    try {
        const where = { is_active: true };
        if (req.query?.audience) {
            where.audience = req.query.audience;
        }
        const features = await Feature.findAll({
            where,
            order: [["id", "ASC"]],
        });
        res.json(features);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch feature definitions", error: error.message });
    }
};
