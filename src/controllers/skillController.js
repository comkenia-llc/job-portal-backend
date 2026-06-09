const { Skill } = require("../models");
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
    const base = slugifyValue(baseValue) || `skill-${Date.now()}`;
    let slug = base;
    let counter = 1;

    while (
        await Skill.findOne({
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
        category: body.category?.trim() || null,
        categoryId: body.categoryId ? parseInt(body.categoryId, 10) || null : null,
        isFeatured: body.isFeatured === "true" || body.isFeatured === true,
        seoTitle: body.seoTitle?.trim() || null,
        seoDescription: body.seoDescription?.trim() || null,
        seoKeywords: body.seoKeywords?.trim() || null,
        canonicalUrl: body.canonicalUrl?.trim() || null,
        metaImage: body.metaImage?.trim() || null,
        schemaType: body.schemaType?.trim() || "DefinedTerm",
        faqSchema: parseJson(body.faqSchema),
        tags: parseJson(body.tags, []),
    };

    if (!payload.name) {
        throw new Error("Name is required");
    }

    payload.slug = await generateUniqueSlug(payload.slug || payload.name, existingId);

    if (!payload.canonicalUrl && publicBaseUrl) {
        payload.canonicalUrl = `${publicBaseUrl}/skills/${payload.slug}`;
    }

    return payload;
};

exports.listSkills = async (req, res) => {
    try {
        const { search, category, isFeatured, page = 1, limit = 50 } = req.query;
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
        if (category) {
            where[Op.or] = [
                ...(where[Op.or] || []),
                { category },
            ];
        }
        if (isFeatured !== undefined) where.isFeatured = isFeatured === "true";

        const total = await Skill.count({ where });
        const items = await Skill.findAll({
            where,
            include: [
                { association: "skillCategory", attributes: ["id", "name", "slug"] },
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
        console.error("❌ listSkills error:", err);
        res.status(500).json({ error: "Failed to fetch skills" });
    }
};

exports.getSkill = async (req, res) => {
    try {
        const identifier = req.params.slugOrId;
        const where = /^\d+$/.test(identifier)
            ? { id: Number(identifier) }
            : { slug: identifier };
        const skill = await Skill.findOne({ where });
        if (!skill) return res.status(404).json({ error: "Skill not found" });
        res.json(skill);
    } catch (err) {
        console.error("❌ getSkill error:", err);
        res.status(500).json({ error: "Failed to fetch skill" });
    }
};

exports.createSkill = async (req, res) => {
    try {
        const payload = await normalizePayload(req.body);
        const skill = await Skill.create(payload);
        const created = await Skill.findByPk(skill.id, {
            include: [{ association: "skillCategory", attributes: ["id", "name", "slug"] }],
        });
        res.status(201).json(created);
    } catch (err) {
        console.error("❌ createSkill error:", err);
        res.status(400).json({ error: err.message || "Failed to create skill" });
    }
};

exports.updateSkill = async (req, res) => {
    try {
        const skill = await Skill.findByPk(req.params.id);
        if (!skill) return res.status(404).json({ error: "Skill not found" });

        const payload = await normalizePayload({ ...skill.toJSON(), ...req.body }, skill.id);
        await skill.update(payload);

        const updated = await Skill.findByPk(skill.id, {
            include: [{ association: "skillCategory", attributes: ["id", "name", "slug"] }],
        });
        res.json(updated);
    } catch (err) {
        console.error("❌ updateSkill error:", err);
        res.status(400).json({ error: err.message || "Failed to update skill" });
    }
};
