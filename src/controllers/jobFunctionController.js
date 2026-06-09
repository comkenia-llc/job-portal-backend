const { JobFunction } = require("../models");
const { Op } = require("sequelize");

const publicBaseUrl = String(process.env.PUBLIC_APP_URL || "").trim().replace(/\/+$/, "");

const parseJson = (value, fallback = null) => {
    if (!value) return fallback;
    if (typeof value === "object") return value;
    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
};

const slugifyValue = (value) =>
    (value || "")
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 90);

const generateUniqueSlug = async (baseValue, excludeId = null) => {
    const base = slugifyValue(baseValue) || `function-${Date.now()}`;
    let slug = base;
    let counter = 1;

    while (
        await JobFunction.findOne({
            where: {
                slug,
                ...(excludeId
                    ? {
                        id: {
                            [Op.ne]: excludeId,
                        },
                    }
                    : {}),
            },
            attributes: ["id"],
        })
    ) {
        slug = `${base}-${counter++}`;
    }

    return slug;
};

const normalizePayload = async (body, existingId = null) => {
    const payload = {
        name: body.name?.trim(),
        slug: body.slug?.trim(),
        description: body.description?.trim() || null,
        parentId: body.parentId ? parseInt(body.parentId, 10) || null : null,
        isFeatured: body.isFeatured === "true" || body.isFeatured === true,
        seoTitle: body.seoTitle?.trim() || null,
        seoDescription: body.seoDescription?.trim() || null,
        seoKeywords: body.seoKeywords?.trim() || null,
        canonicalUrl: body.canonicalUrl?.trim() || null,
        metaImage: body.metaImage?.trim() || null,
        schemaType: body.schemaType?.trim() || "CategoryCode",
        faqSchema: parseJson(body.faqSchema),
        tags: parseJson(body.tags, []),
    };

    if (!payload.name) {
        throw new Error("Name is required");
    }

    payload.slug = await generateUniqueSlug(payload.slug || payload.name, existingId);

    if (!payload.canonicalUrl && publicBaseUrl) {
        payload.canonicalUrl = `${publicBaseUrl}/functions/${payload.slug}`;
    }

    return payload;
};

exports.listFunctions = async (req, res) => {
    try {
        const { search, isFeatured, page = 1, limit = 50 } = req.query;
        const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const offset = (pageNum - 1) * limitNum;

        const where = {};
        if (search?.trim()) {
            const term = search.trim();
            where[Op.or] = [
                { name: { [Op.like]: `%${term}%` } },
                { description: { [Op.like]: `%${term}%` } },
                { seoKeywords: { [Op.like]: `%${term}%` } },
            ];
        }
        if (isFeatured !== undefined) where.isFeatured = isFeatured === "true";

        const total = await JobFunction.count({ where });
        const items = await JobFunction.findAll({
            where,
            include: [
                { model: JobFunction, as: "parent", attributes: ["id", "name", "slug"] },
                { model: JobFunction, as: "children", attributes: ["id", "name", "slug"] },
            ],
            order: [
                ["isFeatured", "DESC"],
                ["name", "ASC"],
            ],
            limit: limitNum,
            offset,
        });

        res.json({
            items,
            total,
            page: pageNum,
            totalPages: Math.max(1, Math.ceil(total / limitNum)),
        });
    } catch (err) {
        console.error("❌ listFunctions error:", err);
        res.status(500).json({ error: "Failed to fetch job functions" });
    }
};

exports.getFunction = async (req, res) => {
    try {
        const identifier = req.params.slugOrId;
        const where = /^\d+$/.test(identifier)
            ? { id: Number(identifier) }
            : { slug: identifier };
        const jobFunction = await JobFunction.findOne({
            where,
            include: [
                { model: JobFunction, as: "parent", attributes: ["id", "name", "slug"] },
                { model: JobFunction, as: "children", attributes: ["id", "name", "slug"] },
            ],
        });
        if (!jobFunction) return res.status(404).json({ error: "Job function not found" });
        res.json(jobFunction);
    } catch (err) {
        console.error("❌ getFunction error:", err);
        res.status(500).json({ error: "Failed to fetch job function" });
    }
};

exports.createFunction = async (req, res) => {
    try {
        const payload = await normalizePayload(req.body);
        const jobFunction = await JobFunction.create(payload);
        res.status(201).json(jobFunction);
    } catch (err) {
        console.error("❌ createFunction error:", err);
        res.status(400).json({ error: err.message || "Failed to create job function" });
    }
};

exports.updateFunction = async (req, res) => {
    try {
        const jobFunction = await JobFunction.findByPk(req.params.id);
        if (!jobFunction) return res.status(404).json({ error: "Job function not found" });

        const payload = await normalizePayload({ ...jobFunction.toJSON(), ...req.body }, jobFunction.id);
        await jobFunction.update(payload);

        res.json(jobFunction);
    } catch (err) {
        console.error("❌ updateFunction error:", err);
        res.status(400).json({ error: err.message || "Failed to update job function" });
    }
};
