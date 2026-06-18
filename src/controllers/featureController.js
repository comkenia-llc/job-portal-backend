const { Feature } = require("../models");
const { applyMarketScope, assignMarketToPayload, resolveRequestMarket } = require("../utils/market");
const { Op } = require("sequelize");

const TYPE_INPUT_COMPATIBILITY = {
    boolean: ["toggle"],
    number: ["number"],
    string: ["text", "select"],
};

const normalizeOptions = (value) => {
    if (!value) return null;
    if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) return null;
        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
                return parsed.map((item) => String(item).trim()).filter(Boolean);
            }
        } catch {
            return trimmed
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean);
        }
    }
    return null;
};

const normalizePayload = (body) => {
    const payload = {
        key: body.key?.trim(),
        audience: body.audience || "employer",
        label: body.label?.trim(),
        type: body.type || "boolean",
        input_type: body.input_type || "toggle",
        default_value:
            body.default_value === undefined || body.default_value === null
                ? null
                : String(body.default_value).trim(),
        options: normalizeOptions(body.options),
        description: body.description?.trim() || null,
        is_active:
            body.is_active === undefined
                ? true
                : body.is_active === true || String(body.is_active).toLowerCase() === "true",
    };

    if (!payload.key || !payload.label) {
        return { error: "Label and key are required" };
    }

    const allowedInputs = TYPE_INPUT_COMPATIBILITY[payload.type] || [];
    if (!allowedInputs.includes(payload.input_type)) {
        return {
            error: `Input type '${payload.input_type}' is not valid for feature type '${payload.type}'`,
        };
    }

    if (payload.type === "boolean" && payload.default_value !== null) {
        const normalized = payload.default_value.toLowerCase();
        if (!["true", "false"].includes(normalized)) {
            return { error: "Boolean features must use true or false as default value" };
        }
        payload.default_value = normalized;
    }

    if (payload.type === "number" && payload.default_value !== null) {
        if (!Number.isFinite(Number(payload.default_value))) {
            return { error: "Number features must use a numeric default value" };
        }
    }

    if (payload.input_type === "select") {
        if (!payload.options || payload.options.length === 0) {
            return { error: "Select features must include one or more options" };
        }
        if (payload.default_value && !payload.options.includes(payload.default_value)) {
            return { error: "Default value must match one of the provided select options" };
        }
    } else {
        payload.options = null;
    }

    return { payload };
};

const buildMarketWhere = (req) => {
    const resolved = resolveRequestMarket(req, {
        allowAdminOverride: true,
        allowExplicitOverride: true,
        allowAllForAdmin: true,
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

const dedupeByMarketPreference = (items = [], activeMarket = "global") => {
    const map = new Map();
    items.forEach((item) => {
        const existing = map.get(item.key);
        if (!existing) {
            map.set(item.key, item);
            return;
        }
        if (item.market === activeMarket && existing.market !== activeMarket) {
            map.set(item.key, item);
        }
    });
    return [...map.values()];
};

// =======================
// 📦 Admin: Create Feature
// =======================
exports.createFeature = async (req, res) => {
    try {
        const built = normalizePayload(req.body);
        if (built.error) {
            return res.status(400).json({ message: built.error });
        }

        assignMarketToPayload(built.payload, req, { allowAdminOverride: true });
        const feature = await Feature.create(built.payload);
        return res.status(201).json(feature);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: "Failed to create feature", error: error.message });
    }
};

// =======================
// 📋 Admin: Get All Features
// =======================
exports.getAllFeatures = async (req, res) => {
    try {
        const featuresRaw = await Feature.findAll({
            where: buildMarketWhere(req),
            order: [["id", "ASC"]],
        });
        const activeMarket = resolveRequestMarket(req, {
            allowAdminOverride: true,
            allowExplicitOverride: true,
            allowAllForAdmin: true,
        }).market;
        res.json(dedupeByMarketPreference(featuresRaw.map((item) => item.toJSON()), activeMarket));
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch features", error: error.message });
    }
};

// =======================
// ✏️ Admin: Update Feature
// =======================
exports.updateFeature = async (req, res) => {
    try {
        const { id } = req.params;
        const feature = await Feature.findOne({
            where: {
                id,
                ...applyMarketScope({}, req, {
                    allowAdminOverride: true,
                    allowExplicitOverride: true,
                    allowAllForAdmin: true,
                }),
            },
        });
        if (!feature) return res.status(404).json({ message: "Feature not found" });

        const built = normalizePayload(req.body);
        if (built.error) {
            return res.status(400).json({ message: built.error });
        }

        assignMarketToPayload(built.payload, req, { allowAdminOverride: true });
        await feature.update(built.payload);
        res.json(feature);
    } catch (error) {
        res.status(400).json({ message: "Failed to update feature", error: error.message });
    }
};

// =======================
// ❌ Admin: Delete Feature
// =======================
exports.deleteFeature = async (req, res) => {
    try {
        const { id } = req.params;
        const feature = await Feature.findOne({
            where: {
                id,
                ...applyMarketScope({}, req, {
                    allowAdminOverride: true,
                    allowExplicitOverride: true,
                    allowAllForAdmin: true,
                }),
            },
        });
        if (!feature) return res.status(404).json({ message: "Feature not found" });

        await feature.destroy();
        res.json({ message: "Feature deleted successfully" });
    } catch (error) {
        res.status(400).json({ message: "Failed to delete feature", error: error.message });
    }
};
