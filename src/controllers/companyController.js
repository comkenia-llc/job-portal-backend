const {
    Company,
    CompanyCategory,
    CompanySubscription,
    Plan,
    Job,
    Application,
    Location,
    User,
} = require("../models");
const { Op, Sequelize } = require("sequelize");
const { getEmployerPlanFeatures, isFeatureEnabled } = require("../utils/planFeatures");
const { assignDefaultEmployerPlan } = require("../services/employerPlanService");
const { applyMarketScope, assignMarketToPayload } = require("../utils/market");
const { assertEmployerMarketAccess } = require("../utils/marketAccess");
const {
    buildCompanyProfileStrength,
    PROFILE_COMPLETION_THRESHOLD,
} = require("../utils/companyProfileStrength");
const {
    sendTemplateMail,
    getSiteUrl,
    getEmployerDashboardUrl,
    getEmployerSettingsUrl,
    getAdminNotificationEmail,
} = require("../services/mailTemplateService");

// ✅ Utility: fix malformed locationId before DB use
function sanitizeLocationId(raw) {
    if (!raw) return null;
    if (Array.isArray(raw)) raw = raw[raw.length - 1];
    if (typeof raw === "string" && raw.includes(",")) {
        console.warn("⚠️ Cleaning malformed locationId string:", raw);
        raw = raw.split(",").pop();
    }
    const parsed = parseInt(raw, 10);
    return isNaN(parsed) ? null : parsed;
}

// 🧩 Utility: convert comma-separated tags → JSON
function normalizeTags(tags) {
    if (!tags) return null;
    if (Array.isArray(tags)) return tags;
    if (typeof tags === "string")
        return tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
    return null;
}

async function buildFullLocation(location) {
    if (!location) return null;

    const chain = [];
    let current = location;

    while (current) {
        chain.unshift(current);
        if (!current.parentId) break;
        current = await Location.findByPk(current.parentId);
    }

    const country = chain.find((item) => item.type === "country");
    const state = chain.find((item) => item.type === "state");
    const city = chain.find((item) => item.type === "city");
    const neighborhood = chain.find((item) => item.type === "neighborhood");

    const areaName = neighborhood?.name || null;
    const cityName = city?.name || location.city || null;
    const stateName = state?.name || location.state || null;
    const countryName = country?.name || location.country || null;
    const countryCode = country?.countryCode || location.countryCode || null;

    const labelParts = [
        areaName,
        cityName,
        countryCode === "AE" ? "UAE" : countryName,
    ].filter(Boolean);

    return {
        id: location.id,
        name: location.name,
        type: location.type,
        slug: location.slug,

        area: areaName,
        city: cityName,
        state: stateName,
        country: countryName,
        countryCode,

        label: [...new Set(labelParts)].join(", "),
    };
}

const slugifyValue = (value = "") =>
    value
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 90);

const generateUniqueCompanySlug = async (rawValue, excludeId = null, market = null) => {
    const base = slugifyValue(rawValue) || `company-${Date.now()}`;
    let slug = base;
    let counter = 1;

    while (
        await Company.findOne({
            where: {
                slug,
                ...(excludeId
                    ? {
                          id: {
                              [Op.ne]: excludeId,
                          },
                      }
                    : {}),
                ...(market ? { market } : {}),
            },
            attributes: ["id"],
        })
    ) {
        slug = `${base}-${counter++}`;
        }

        return slug;
    };

function buildLocationLabel(location) {
    if (!location) return null;
    const normalized = (text) => (typeof text === "string" ? text.trim() : "");
    const name = normalized(location.name);
    const city = normalized(location.city);
    const state = normalized(location.state);
    const country = normalized(location.country);
    if (!name && !city && !state && !country) return null;

    const parts = [city, state, country].filter(Boolean);
    if (name) {
        const parentLabel = parts.join(", ");
        if (parentLabel && !name.includes(parentLabel)) {
            return `${name} · ${parentLabel}`;
        }
        return name;
    }

    return parts.join(", ");
}

const locationInclude = {
    model: Location,
    attributes: [
        "id",
        "name",
        "city",
        "state",
        "country",
        "slug",
        "countryCode",
        "parentId",
        "type",
    ],
};
const companyCategoryInclude = {
    model: CompanyCategory,
    as: "companyCategory",
    attributes: ["id", "name", "slug"],
};

const DEFAULT_NOTIFICATION_PREFERENCES = {
    newApplications: true,
    candidateMessages: true,
    interviewReminders: true,
    jobExpiryReminders: true,
    billingUpdates: true,
    securityAlerts: true,
    productAnnouncements: false,
};

const DEFAULT_COMMUNICATION_PREFERENCES = {
    emailDelivery: "instant",
    summaryEmail: "daily",
    weekendMessages: true,
    quietHours: false,
};

function parseJsonInput(value) {
    if (!value) return null;
    if (typeof value === "object") return value;
    if (typeof value !== "string") return null;
    try {
        return JSON.parse(value);
    } catch (_) {
        return null;
    }
}

function normalizeNotificationPreferences(value) {
    const parsed = parseJsonInput(value);
    return {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        ...(parsed && typeof parsed === "object" ? parsed : {}),
    };
}

function normalizeCommunicationPreferences(value) {
    const parsed = parseJsonInput(value);
    const next = {
        ...DEFAULT_COMMUNICATION_PREFERENCES,
        ...(parsed && typeof parsed === "object" ? parsed : {}),
    };

    if (!["instant", "hourly", "manual"].includes(next.emailDelivery)) {
        next.emailDelivery = DEFAULT_COMMUNICATION_PREFERENCES.emailDelivery;
    }
    if (!["daily", "weekly", "never"].includes(next.summaryEmail)) {
        next.summaryEmail = DEFAULT_COMMUNICATION_PREFERENCES.summaryEmail;
    }

    return next;
}

const serializeCompanyWithProfileStrength = (company) => {
    const json = typeof company?.toJSON === "function" ? company.toJSON() : { ...(company || {}) };
    return {
        ...json,
        notificationPreferences: normalizeNotificationPreferences(json.notificationPreferences),
        communicationPreferences: normalizeCommunicationPreferences(json.communicationPreferences),
        profileStrength: buildCompanyProfileStrength(json),
    };
};

const buildCompanyLocationText = (location) =>
    location?.name ||
    [location?.city, location?.state, location?.country].filter(Boolean).join(", ") ||
    "";


exports.createCompany = async (req, res) => {
    try {
        const data = req.body;
        data.createdBy = req.user.id;
        assignMarketToPayload(data, req, { allowAdminOverride: true });

        if (req.user.role === "employer") {
            const access = await assertEmployerMarketAccess(req);
            if (!access.ok && req.user.companyId) {
                return res.status(access.status).json({ error: access.error });
            }
            if (req.user.companyId) {
                return res.status(409).json({ error: "Employer account is already linked to a company" });
            }
        }

        console.log("🟢 Incoming BODY:", JSON.stringify(data, null, 2));
        console.log("🟢 Incoming FILES:", Object.keys(req.files || {}));

        // Convert empty strings to null
        for (const key of Object.keys(data)) {
            if (data[key] === "") data[key] = null;
        }

        // ✅ Clean locationId
        data.locationId = sanitizeLocationId(data.locationId);
        if (data.companyCategoryId !== undefined && data.companyCategoryId !== null && data.companyCategoryId !== "") {
            const parsed = parseInt(data.companyCategoryId, 10);
            data.companyCategoryId = Number.isNaN(parsed) ? null : parsed;
        }
        if (data.locationId) {
            const location = await Location.findByPk(data.locationId);
            if (!location) {
                return res.status(400).json({ error: "Invalid location selected" });
            }
            if (location.market && location.market !== data.market) {
                return res.status(400).json({ error: "Selected location belongs to a different market" });
            }
        }

        // ✅ Normalize tags
        if (data.tags) data.tags = normalizeTags(data.tags);

        // ✅ Handle uploads
        if (req.files?.logo)
            data.logoUrl = `/uploads/companies/logo/${req.files.logo[0].filename}`;
        if (req.files?.banner)
            data.bannerUrl = `/uploads/companies/banner/${req.files.banner[0].filename}`;
        if (req.files?.metaImage)
            data.metaImage = `/uploads/companies/meta/${req.files.metaImage[0].filename}`;

        console.log("🟡 Parsed Company Data before insert:", JSON.stringify(data, null, 2));

        // Validate
        if (!data.name)
            return res.status(400).json({ error: "Company name is required" });
        if (!data.industry)
            return res.status(400).json({ error: "Industry is required" });
        if (req.user.role === "employer" && !data.logoUrl) {
            return res.status(400).json({ error: "Company logo is required" });
        }

        if (req.user.role === "employer") {
            const profileStrength = buildCompanyProfileStrength(data);
            if (profileStrength.score < PROFILE_COMPLETION_THRESHOLD) {
                return res.status(400).json({
                    error: `Complete your company profile to at least ${PROFILE_COMPLETION_THRESHOLD}% before continuing`,
                    profileStrength,
                });
            }
        }

        // ✅ Create company
        const slugSeed = data.slug || data.name;
        data.slug = await generateUniqueCompanySlug(slugSeed, null, data.market);

        const company = await Company.create(data);
        console.log("✅ Created Company:", company.toJSON());

        // ✅ Link employer user to this company (only if employer role)
        if (req.user.role === "employer") {
            await User.update(
                { company_id: company.id },
                { where: { id: req.user.id } }
            );
            console.log(`🔗 Linked user ${req.user.id} → company ${company.id}`);
            await assignDefaultEmployerPlan(company.id);
            console.log(`🧾 Assigned default free employer plan to company ${company.id}`);

            const owner = await User.findByPk(req.user.id, {
                attributes: ["id", "email", "firstName", "lastName", "username", "phone", "status", "emailVerified"],
            });
            const location = company.locationId ? await Location.findByPk(company.locationId) : null;
            const companyLocation = buildCompanyLocationText(location);
            const employerName =
                `${owner?.firstName || ""} ${owner?.lastName || ""}`.trim() ||
                owner?.username ||
                owner?.email ||
                "there";

            if (owner?.email) {
                sendTemplateMail({
                    template: "employerSignupReceived",
                    to: owner.email,
                    data: {
                        employerName,
                        companyName: company.name || "",
                        companyIndustry: company.industry || "",
                        companyLocation,
                        submittedAt: company.createdAt || new Date(),
                        dashboardUrl: getEmployerDashboardUrl(),
                        companyProfileUrl: getEmployerSettingsUrl(),
                    },
                }).catch((mailErr) =>
                    console.warn("⚠️ [MAILER] Employer signup received email failed:", mailErr.message)
                );
            }

            sendTemplateMail({
                template: "adminNewEmployer",
                to: getAdminNotificationEmail(),
                data: {
                    employerName,
                    employerEmail: owner?.email || "",
                    employerPhone: owner?.phone || "",
                    companyName: company.name || "",
                    companyIndustry: company.industry || "",
                    companyWebsite: company.website || "",
                    companyLocation,
                    companySize: company.size || "",
                    registeredAt: company.createdAt || new Date(),
                    verificationStatus: owner?.emailVerified ? "verified" : "unverified",
                    employerStatus: owner?.status || "pending",
                    reviewUrl: `${getSiteUrl()}/admin/users`,
                    adminDashboardUrl: `${getSiteUrl()}/admin`,
                },
            }).catch((mailErr) =>
                console.warn("⚠️ [MAILER] Admin new employer email failed:", mailErr.message)
            );
        }

        res.status(201).json(serializeCompanyWithProfileStrength(company));
    } catch (err) {
        console.error("❌ Create company error:", err);
        res.status(500).json({ error: "Server error" });
    }
};


// 🧩 Update company
exports.updateCompany = async (req, res) => {
    try {
        const company = await Company.findByPk(req.params.id);
        if (!company)
            return res.status(404).json({ error: "Company not found" });
        if (req.user.role === "employer") {
            const access = await assertEmployerMarketAccess(req);
            if (!access.ok) {
                return res.status(access.status).json({ error: access.error });
            }
            if (req.user.companyId !== company.id) {
                return res.status(403).json({ error: "You can only update your linked company" });
            }
        }

        const data = req.body;
        assignMarketToPayload(data, req, { allowAdminOverride: true });

        console.log("\n🟢 [UPDATE] Raw BODY:", JSON.stringify(data, null, 2));
        console.log("🟢 [UPDATE] Files:", Object.keys(req.files || {}));


        // Convert empty strings to null
        for (const key of Object.keys(data)) {
            if (data[key] === "") data[key] = null;
        }

        // ✅ Clean locationId
        data.locationId = sanitizeLocationId(data.locationId);
        if (data.companyCategoryId !== undefined && data.companyCategoryId !== null && data.companyCategoryId !== "") {
            const parsed = parseInt(data.companyCategoryId, 10);
            data.companyCategoryId = Number.isNaN(parsed) ? null : parsed;
        }
        if (data.locationId) {
            const location = await Location.findByPk(data.locationId);
            if (!location) {
                return res.status(400).json({ error: "Invalid location selected" });
            }
            if (location.market && location.market !== (data.market || company.market)) {
                return res.status(400).json({ error: "Selected location belongs to a different market" });
            }
        }

        // ✅ Normalize tags
        if (data.tags) data.tags = normalizeTags(data.tags);
        if (Object.prototype.hasOwnProperty.call(data, "notificationPreferences")) {
            data.notificationPreferences = normalizeNotificationPreferences(data.notificationPreferences);
        }
        if (Object.prototype.hasOwnProperty.call(data, "communicationPreferences")) {
            data.communicationPreferences = normalizeCommunicationPreferences(data.communicationPreferences);
        }

        // ✅ Handle SEO file uploads
        if (req.files?.logo)
            data.logoUrl = `/uploads/companies/logo/${req.files.logo[0].filename}`;
        if (req.files?.banner)
            data.bannerUrl = `/uploads/companies/banner/${req.files.banner[0].filename}`;
        if (req.files?.metaImage)
            data.metaImage = `/uploads/companies/meta/${req.files.metaImage[0].filename}`;

        if ((data.name && data.name !== company.name) || data.slug) {
            const slugSeed = data.slug || data.name || company.name;
            data.slug = await generateUniqueCompanySlug(slugSeed, company.id, data.market || company.market);
        }

        console.log("📦 Updating company", company.id, "with:", data);
        console.log("🟡 [UPDATE] Final data before DB update:", JSON.stringify(data, null, 2));

        await company.update(data);
        res.json(serializeCompanyWithProfileStrength(company));
    } catch (err) {
        console.error("❌ Update company error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

// 📋 Get all companies
exports.getCompanies = async (req, res) => {
    try {
        const sort = req.query.sort;
        const rawLimit = req.query.limit ? parseInt(req.query.limit, 10) : null;
        
        const limit = Math.min(Math.max(rawLimit || 20, 1), 50);
        
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const paginated = req.query.paginated === "true";
        const search = (req.query.search || "").trim();
        const { companyCategoryId, companyCategorySlug } = req.query;
        let resolvedCategoryId = companyCategoryId ? parseInt(companyCategoryId, 10) : null;
        if (!resolvedCategoryId && companyCategorySlug) {
            const category = await CompanyCategory.findOne({ where: { slug: companyCategorySlug } });
            resolvedCategoryId = category?.id || null;
        }
        const where = applyMarketScope({}, req, {
            allowAdminOverride: true,
            allowAllForAdmin: true,
        });
        if (resolvedCategoryId) {
            where.companyCategoryId = resolvedCategoryId;
        }

        if (sort === "jobs") {
            const jobAgg = await Job.findAll({
                where: applyMarketScope({}, req, {
                    allowAdminOverride: true,
                    allowAllForAdmin: true,
                }),
                attributes: [
                    "companyId",
                    [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
                ],
                group: ["companyId"],
                order: [[Sequelize.literal("count"), "DESC"]],
                limit: limit || 50,
                raw: true,
            });

            const companyIds = jobAgg.map((row) => row.companyId).filter(Boolean);
        const companies = await Company.findAll({
            where: { id: companyIds, ...where },
            include: [locationInclude, companyCategoryInclude],
        });
        const companyMap = Object.fromEntries(
            companies.map((company) => [company.id, serializeCompanyWithProfileStrength(company)])
        );
        const enriched = jobAgg
            .map((row) => {
            const company = companyMap[row.companyId];
            if (!company) return null;
            const serialized = { ...company };
            const location = serialized.Location
                ? {
                      ...serialized.Location,
                      label: buildLocationLabel(serialized.Location),
                  }
                : null;
            delete serialized.Location;
            return {
                ...serialized,
                location,
                jobCount: Number(row.count),
            };
            })
            .filter(Boolean);

            return res.json(limit ? enriched.slice(0, limit) : enriched);
        }

        const options = {
            order: [["createdAt", "DESC"]],
            include: [locationInclude, companyCategoryInclude],
            where,
        };
        if (search) {
            options.where = {
                ...options.where,
                [Op.or]: [
                    { name: { [Op.like]: `%${search}%` } },
                    { legalName: { [Op.like]: `%${search}%` } },
                    { industry: { [Op.like]: `%${search}%` } },
                    { headquarters: { [Op.like]: `%${search}%` } },
                ],
            };
        }
        if (limit) options.limit = limit;
        if (paginated && !limit) options.limit = 20;
        if (paginated) options.offset = (page - 1) * (options.limit || 20);
        const companies = await Company.findAll(options);

        const jobCounts = await Job.findAll({
            where: applyMarketScope({}, req, {
                allowAdminOverride: true,
                allowAllForAdmin: true,
            }),
            attributes: [
                "companyId",
                [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
            ],
            group: ["companyId"],
            raw: true,
        });
        const jobMap = Object.fromEntries(
            jobCounts.map((row) => [row.companyId, Number(row.count)])
        );

        const enriched = companies.map((company) => {
            const json = serializeCompanyWithProfileStrength(company);
            const location = json.Location
                ? {
                      ...json.Location,
                      label: buildLocationLabel(json.Location),
                  }
                : null;
            delete json.Location;
            return {
                ...json,
                location,
                jobCount: jobMap[company.id] || 0,
            };
        });

        if (paginated) {
            const totalCompanies = await Company.count({ where: options.where });
            const limitForCalc = options.limit || 20;
            return res.json({
                companies: enriched,
                total: totalCompanies,
                page,
                totalPages: Math.max(1, Math.ceil(totalCompanies / limitForCalc)),
            });
        }

        res.json(enriched);
    } catch (err) {
        console.error("❌ Get companies error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

// 🔍 Get company by ID
exports.getCompanyById = async (req, res) => {
    try {
        const company = await Company.findOne({
            where: applyMarketScope({ id: req.params.id }, req, {
                allowAdminOverride: true,
                allowAllForAdmin: true,
            }),
            include: [locationInclude, companyCategoryInclude],
        });
        if (!company)
            return res.status(404).json({ error: "Company not found" });
        res.json(serializeCompanyWithProfileStrength(company));
    } catch (err) {
        console.error("❌ Get company error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

exports.getCompanyBySlug = async (req, res) => {
    try {
        const company = await Company.findOne({
            where: applyMarketScope({ slug: req.params.slug }, req, {
                allowAdminOverride: true,
                allowAllForAdmin: true,
            }),
            include: [locationInclude, companyCategoryInclude],
        });

        if (!company) {
            return res.status(404).json({ error: "Company not found" });
        }

        const jobCount = await Job.count({
            where: applyMarketScope(
                {
                    companyId: company.id,
                    status: "open",
                },
                req,
                {
                    allowAdminOverride: true,
                    allowAllForAdmin: true,
                }
            ),
        });

        const json = serializeCompanyWithProfileStrength(company);
        const location = json.Location
            ? await buildFullLocation(json.Location)
            : null;

        delete json.Location;

        res.json({
            ...json,
            location,
            jobCount,
        });
    } catch (err) {
        console.error("❌ Get company by slug error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

// ❌ Delete company
exports.deleteCompany = async (req, res) => {
    try {
        const company = await Company.findByPk(req.params.id);
        if (!company)
            return res.status(404).json({ error: "Company not found" });

        await company.destroy();
        res.json({ message: "Company deleted" });
    } catch (err) {
        console.error("❌ Delete company error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

// 🧮 Admin view with pagination + search
exports.getAllCompaniesAdmin = async (req, res) => {
    try {
        const { page = 1, limit = 12, search = "" } = req.query;
        
        const limitNum = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 200);
        const offset = (page - 1) * limitNum;

        const where = applyMarketScope({}, req, {
            allowAdminOverride: true,
            allowAllForAdmin: true,
        });
        if (search.trim()) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { legalName: { [Op.like]: `%${search}%` } },
                { industry: { [Op.like]: `%${search}%` } },
                { headquarters: { [Op.like]: `%${search}%` } },
            ];
        }

        const { rows, count } = await Company.findAndCountAll({
            where,
            order: [["createdAt", "DESC"]],
            offset,
            limit: limitNum,
            include: [locationInclude, companyCategoryInclude],
        });

        const enrichedRows = rows.map((company) => {
            const json = serializeCompanyWithProfileStrength(company);
            const location = json.Location
                ? {
                     ...json.Location,
                      label: buildLocationLabel(json.Location),
                  }
                : null;
            delete json.Location;
            return {
                ...json,
                location,
            };
        });

        res.json({
            companies: enrichedRows,
            total: count,
            totalPages: Math.ceil(count / limitNum),
            page: parseInt(page),
        });
    } catch (err) {
        console.error("❌ Admin getAllCompanies error:", err);
        res.status(500).json({ error: "Failed to fetch all companies" });
    }
};

exports.getCompanyPlan = async (req, res) => {
    try {
        const companyId = req.user.companyId;

        // 🧩 Prevent undefined lookups
        if (!companyId) {
            return res.status(400).json({
                message: "This endpoint is only available for company/employer accounts.",
            });
        }

        const subscription = await CompanySubscription.findOne({
            where: {
                company_id: companyId,
                status: "active",
                end_date: { [Op.or]: [{ [Op.gt]: new Date() }, { [Op.is]: null }] },
            },
            include: [
                {
                    model: Plan,
                    attributes: ["id", "name", "slug", "features", "price_monthly", "duration_type"],
                },
            ],
        });

        if (!subscription)
            return res.status(404).json({ message: "No active plan found for this company." });

        const plan = subscription.Plan;
        const company = await Company.findByPk(companyId, {
            attributes: [
                "id",
                "name",
                "slug",
                "logoUrl",
                "bannerUrl",
                "industry",
                "companyCategoryId",
                "size",
                "tagline",
                "about",
                "website",
                "email",
                "phone",
                "foundedYear",
                "locationId",
            ],
        });

        const jobCount = await Job.count({ where: { companyId } });

        const usage = {
            jobs_used: jobCount,
            max_jobs: plan.features?.max_jobs ?? "unlimited",
        };

        res.json({
            plan_name: plan.name,
            slug: plan.slug,
            price: plan.price_monthly,
            duration: plan.duration_type,
            features: plan.features,
            usage,
            start_date: subscription.start_date,
            end_date: subscription.end_date,
            renewal_method: subscription.renewal_method,
            status: subscription.status,
            company: company ? serializeCompanyWithProfileStrength(company) : null,
        });
    } catch (error) {
        console.error("getCompanyPlan error:", error);
        res.status(500).json({ message: "Failed to fetch company plan", error: error.message });
    }
};

exports.getCompanyAnalytics = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) {
            return res.status(400).json({ error: "No company linked with this employer." });
        }

        if (req.user?.role === "employer") {
            const features = await getEmployerPlanFeatures(companyId);
            if (!features) {
                return res.status(402).json({ error: "No active plan found for this employer." });
            }
            if (!isFeatureEnabled(features.can_access_analytics)) {
                return res.status(403).json({ error: "Your plan does not allow analytics access." });
            }
        }

        console.log("📊 Fetching analytics for company:", companyId);

        // 1️⃣ Fetch all jobs by this company
        const jobs = await Job.findAll({
            where: { companyId },
            attributes: ["id", "title", "views", "createdAt"],
            order: [["createdAt", "DESC"]],
        });

        // 2️⃣ Count total applications for these jobs
        const jobIds = jobs.map((j) => j.id);
        const applications = await Application.findAll({
            where: { jobId: { [Op.in]: jobIds } },
            attributes: ["id", "jobId", "source"],
        });

        // 3️⃣ Summaries
        const totalViews = jobs.reduce((sum, j) => sum + (j.views || 0), 0);
        const totalApplications = applications.length;
        const activeJobs = jobs.length;

        // 4️⃣ Aggregate top jobs (by number of applications)
        const jobApplicationCount = {};
        applications.forEach((a) => {
            jobApplicationCount[a.jobId] = (jobApplicationCount[a.jobId] || 0) + 1;
        });

        const topJobs = jobs
            .map((j) => ({
                title: j.title,
                applicants: jobApplicationCount[j.id] || 0,
            }))
            .sort((a, b) => b.applicants - a.applicants)
            .slice(0, 5);

        // 5️⃣ Applicant sources breakdown
        const sourceCount = {};
        applications.forEach((a) => {
            const src = a.source || "Direct";
            sourceCount[src] = (sourceCount[src] || 0) + 1;
        });

        const applicantSources = Object.entries(sourceCount)
            .map(([name, value]) => ({ name, value }))
            .slice(0, 5);

        // 6️⃣ Chart placeholder (replace with real monthly analytics later)
        const jobViews = [
            { month: "Jan", views: 1200, applications: 35 },
            { month: "Feb", views: 1500, applications: 42 },
            { month: "Mar", views: 2100, applications: 65 },
            { month: "Apr", views: 1850, applications: 50 },
            { month: "May", views: 2400, applications: 72 },
            { month: "Jun", views: 2800, applications: 95 },
        ];

        // 7️⃣ Combine response
        const analytics = {
            summary: {
                totalViews,
                totalApplications,
                activeJobs,
                conversionRate: `${((totalApplications / (totalViews || 1)) * 100).toFixed(2)}%`,
            },
            jobViews,
            topJobs,
            applicantSources,
        };

        res.json(analytics);
    } catch (err) {
        console.error("❌ Analytics Error:", err);
        res.status(500).json({ error: "Failed to fetch analytics" });
    }
};
