const { Plan, Feature } = require("../models");
const { Op } = require("sequelize");
const { assignMarketToPayload, applyMarketScope, resolveRequestMarket } = require("../utils/market");
const { getCurrencyForMarket } = require("../utils/marketCatalog");

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

const resolveStripeEnvKeys = (plan, cycle = "monthly") => {
    const candidates = buildStripeKeyCandidates(plan);
    if (!candidates.length) return [];
    const suffix = cycle === "yearly" ? "_YEARLY" : "_MONTHLY";
    const keys = candidates.map((candidate) => `STRIPE_PRICE_${candidate}${suffix}`);
    // Legacy fallback: no suffix for monthly
    if (cycle === "monthly") {
        candidates.forEach((candidate) => keys.push(`STRIPE_PRICE_${candidate}`));
    }
    return keys;
};

const stripeAvailability = (plan) => {
    const monthlyKeys = resolveStripeEnvKeys(plan, "monthly");
    const yearlyKeys = resolveStripeEnvKeys(plan, "yearly");
    return {
        stripe_monthly_ready: monthlyKeys.some((k) => process.env[k]),
        stripe_yearly_ready: yearlyKeys.some((k) => process.env[k]),
    };
};

const hasAudienceColumn = () => Boolean(Plan.rawAttributes && Plan.rawAttributes.audience);
const buildMarketWhere = (req, options = {}) => {
    const resolved = resolveRequestMarket(req, {
        allowAdminOverride: true,
        allowExplicitOverride: true,
        allowAllForAdmin: true,
        ...options,
    });
    if (!resolved.market || resolved.market === "global") {
        return { market: "global" };
    }
    return {
        market: {
            [Op.in]: [resolved.market, "global"],
        },
    };
};

const dedupeByMarketPreference = (items = [], keyField = "slug", activeMarket = "global") => {
    const map = new Map();

    items.forEach((item) => {
        const key = item[keyField];
        const existing = map.get(key);
        if (!existing) {
            map.set(key, item);
            return;
        }
        if (item.market === activeMarket && existing.market !== activeMarket) {
            map.set(key, item);
        }
    });

    return [...map.values()];
};

const dedupeFeatureDefinitions = (items = [], activeMarket = "global") => {
    const map = new Map();

    items.forEach((item) => {
        const key = `${item.audience}:${item.key}`;
        const existing = map.get(key);
        if (!existing) {
            map.set(key, item);
            return;
        }
        if (item.market === activeMarket && existing.market !== activeMarket) {
            map.set(key, item);
        }
    });

    return [...map.values()];
};

const buildFeatureDisplayValue = (definition, value) => {
    if (value === null || value === undefined || value === false || value === "") return null;
    if (definition.type === "number") return String(value);
    if (definition.type === "string") return String(value);
    return null;
};

const buildFeatureDetailsForPlan = (plan, definitionsByKey = new Map()) => {
    const rawFeatures = normalizeFeatures(plan?.features) || {};

    return Object.entries(rawFeatures)
        .filter(([, value]) => value !== null && value !== undefined && value !== false && value !== "")
        .map(([key, value]) => {
            const definition = definitionsByKey.get(`${plan.audience || "employer"}:${key}`);
            if (!definition) return null;

            return {
                key,
                label: definition.label,
                description: definition.description || null,
                type: definition.type,
                value,
                display_value: buildFeatureDisplayValue(definition, value),
            };
        })
        .filter(Boolean);
};

const normalizeBooleanValue = (value) => {
    if (value === true || value === false) return value;
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (normalized === "true") return true;
        if (normalized === "false") return false;
    }
    return null;
};

const normalizeNumberValue = (value) => {
    if (value === "" || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const buildPlanPayload = async (body, existingPlan = null, market = "global") => {
    const normalizedMarket = market || existingPlan?.market || "global";
    const audience = body.audience || existingPlan?.audience || "employer";
    const featureDefinitions = await Feature.findAll({
        where: {
            is_active: true,
            audience,
            market: {
                [Op.in]: [normalizedMarket, "global"],
            },
        },
        order: [["id", "ASC"]],
    });

    const featureMap = new Map(featureDefinitions.map((item) => [item.key, item]));
    const incomingFeatures = normalizeFeatures(body.features) || {};
    const existingFeatures = normalizeFeatures(existingPlan?.features) || {};
    const nextFeatures = {};

    for (const definition of featureDefinitions) {
        const hasIncomingValue = Object.prototype.hasOwnProperty.call(incomingFeatures, definition.key);
        const rawValue = hasIncomingValue
            ? incomingFeatures[definition.key]
            : Object.prototype.hasOwnProperty.call(existingFeatures, definition.key)
              ? existingFeatures[definition.key]
              : definition.default_value;

        if (definition.type === "boolean") {
            const normalized = normalizeBooleanValue(rawValue);
            if (normalized === null) {
                return {
                    error: `${definition.label} must be true or false`,
                };
            }
            nextFeatures[definition.key] = normalized;
            continue;
        }

        if (definition.type === "number") {
            const normalized = normalizeNumberValue(rawValue);
            if (normalized === null) {
                return {
                    error: `${definition.label} must be a valid number`,
                };
            }
            nextFeatures[definition.key] = normalized;
            continue;
        }

        if (definition.type === "string") {
            const nextValue =
                rawValue === null || rawValue === undefined ? "" : String(rawValue).trim();

            if (definition.input_type === "select" && Array.isArray(definition.options) && definition.options.length > 0) {
                if (nextValue && !definition.options.includes(nextValue)) {
                    return {
                        error: `${definition.label} must match one of the allowed options`,
                    };
                }
            }

            nextFeatures[definition.key] = nextValue;
        }
    }

    for (const key of Object.keys(incomingFeatures)) {
        if (!featureMap.has(key)) {
            return {
                error: `Unknown feature key: ${key}`,
            };
        }
    }

    return {
        payload: {
            name: body.name?.trim(),
            slug: body.slug?.trim(),
            market: normalizedMarket,
            audience,
            price_monthly: normalizeNumberValue(body.price_monthly) ?? 0,
            price_yearly:
                body.price_yearly === "" || body.price_yearly === null || body.price_yearly === undefined
                    ? null
                    : normalizeNumberValue(body.price_yearly),
            currency: getCurrencyForMarket(normalizedMarket),
            duration_type: body.duration_type || "monthly",
            features: nextFeatures,
            description: body.description?.trim() || null,
            ribbon_text: body.ribbon_text?.trim() || null,
            ribbon_color: body.ribbon_color?.trim() || null,
            ribbon_text_color: body.ribbon_text_color?.trim() || null,
            is_active:
                body.is_active === undefined
                    ? existingPlan?.is_active ?? true
                    : normalizeBooleanValue(body.is_active),
        },
    };
};

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
        const marketSeed = {
            market: req.body.market || req.query?.market || req.headers["x-market"],
        };
        assignMarketToPayload(marketSeed, req, { allowAdminOverride: true });
        const built = await buildPlanPayload(req.body, null, marketSeed.market);
        if (built.error) {
            return res.status(400).json({ message: built.error });
        }
        if (!built.payload.name || !built.payload.slug) {
            return res.status(400).json({ message: "Name and slug are required" });
        }

        const plan = await Plan.create(built.payload);

        return res.status(201).json({
            ...plan.toJSON(),
            ...stripeAvailability(plan),
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
        const where = buildMarketWhere(_req);
        if (audienceSupported && _req.query?.audience) {
            where.audience = _req.query.audience;
        }

        const plansRaw = await Plan.findAll({
            attributes: [
                "id",
                "name",
                "slug",
                "market",
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
        const resolvedMarket = resolveRequestMarket(_req, {
            allowAdminOverride: true,
            allowExplicitOverride: true,
            allowAllForAdmin: true,
        }).market;
        const definitionRows = await Feature.findAll({
            where: {
                is_active: true,
                market: resolvedMarket && resolvedMarket !== "global" ? { [Op.in]: [resolvedMarket, "global"] } : "global",
            },
            order: [["id", "ASC"]],
        });
        const definitionsByKey = new Map(
            dedupeFeatureDefinitions(definitionRows.map((item) => item.toJSON()), resolvedMarket).map((item) => [
                `${item.audience}:${item.key}`,
                item,
            ])
        );
        const plans = dedupeByMarketPreference(
            plansRaw.map((p) => {
                const plain = p.toJSON();
                return {
                    ...plain,
                    features: normalizeFeatures(plain.features),
                    feature_details: buildFeatureDetailsForPlan(plain, definitionsByKey),
                    ...stripeAvailability(plain),
                };
            }),
            "slug",
            resolvedMarket
        );
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
        const where = buildMarketWhere(_req);
        if (audienceSupported && _req.query?.audience) {
            where.audience = _req.query.audience;
        }

        const plansRaw = await Plan.findAll({
            attributes: [
                "id",
                "name",
                "slug",
                "market",
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
        const resolvedMarket = resolveRequestMarket(_req, {
            allowExplicitOverride: true,
        }).market;
        const definitionRows = await Feature.findAll({
            where: {
                is_active: true,
                market: resolvedMarket && resolvedMarket !== "global" ? { [Op.in]: [resolvedMarket, "global"] } : "global",
            },
            order: [["id", "ASC"]],
        });
        const definitionsByKey = new Map(
            dedupeFeatureDefinitions(definitionRows.map((item) => item.toJSON()), resolvedMarket).map((item) => [
                `${item.audience}:${item.key}`,
                item,
            ])
        );
        const plans = dedupeByMarketPreference(
            plansRaw.map((p) => {
                const plain = p.toJSON();
                return {
                    ...plain,
                    features: normalizeFeatures(plain.features),
                    feature_details: buildFeatureDetailsForPlan(plain, definitionsByKey),
                    ...stripeAvailability(plain),
                };
            }),
            "slug",
            resolvedMarket
        );
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
        const plain = plan.toJSON();
        res.json({
            ...plain,
            features: normalizeFeatures(plain.features),
            feature_details: buildFeatureDetailsForPlan(plain, new Map()),
            ...stripeAvailability(plain),
        });
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

        const marketSeed = {
            market: req.body.market || plan.market,
        };
        assignMarketToPayload(marketSeed, req, { allowAdminOverride: true });
        const built = await buildPlanPayload(req.body, plan, marketSeed.market);
        if (built.error) {
            return res.status(400).json({ message: built.error });
        }
        if (!built.payload.name || !built.payload.slug) {
            return res.status(400).json({ message: "Name and slug are required" });
        }

        await plan.update(built.payload);
        res.json({
            ...plan.toJSON(),
            ...stripeAvailability(plan),
        });
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
        const where = {
            is_active: true,
            ...buildMarketWhere(req),
        };
        if (req.query?.audience) {
            where.audience = req.query.audience;
        }
        const featuresRaw = await Feature.findAll({
            where,
            order: [["id", "ASC"]],
        });
        const resolvedMarket = resolveRequestMarket(req, {
            allowAdminOverride: true,
            allowExplicitOverride: true,
            allowAllForAdmin: true,
        }).market;
        res.json(dedupeByMarketPreference(featuresRaw.map((item) => item.toJSON()), "key", resolvedMarket));
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch feature definitions", error: error.message });
    }
};
