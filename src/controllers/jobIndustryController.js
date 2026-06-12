"use strict";

const { Op } = require("sequelize");
const { JobIndustry, Job } = require("../models");

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

const parseJson = (value, fallback = null) => {
    if (!value) return fallback;
    if (typeof value === "object") return value;

    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
};

const generateUniqueSlug = async (name, providedSlug, market = "global", excludeId = null) => {
    const base = slugifyValue(providedSlug || name || `industry-${Date.now()}`);
    let slug = base;
    let counter = 1;
    const normalizedMarket = market?.trim()?.toLowerCase() || "global";

    while (
        await JobIndustry.findOne({
            where: {
                slug,
                market: normalizedMarket,
                ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}),
            },
            attributes: ["id"],
        })
    ) {
        slug = `${base}-${counter++}`;
    }

    return slug;
};

const normalizePayload = async (body, existingId = null) => {
    if (!body.name?.trim()) {
        throw new Error("Name is required");
    }

    return {
        name: body.name.trim(),
        market: body.market?.trim()?.toLowerCase() || "global",
        slug: await generateUniqueSlug(
            body.name,
            body.slug,
            body.market?.trim()?.toLowerCase() || "global",
            existingId
        ),
        description: body.description?.trim() || null,
        content: body.content || null,
        seoTitle: body.seoTitle?.trim() || null,
        seoDescription: body.seoDescription?.trim() || null,
        seoKeywords: body.seoKeywords?.trim() || null,
        canonicalUrl: body.canonicalUrl?.trim() || null,
        metaImage: body.metaImage?.trim() || null,
        schemaType: body.schemaType?.trim() || "DefinedTerm",
        faqSchema: parseJson(body.faqSchema, null),
        tags: parseJson(body.tags, []),
        isFeatured: body.isFeatured === true || body.isFeatured === "true",
        status: body.status?.trim() || "active",
    };
};

exports.listIndustries = async (req, res) => {
    try {
        const { search = "", status, isFeatured, market, includeGlobal, page = 1, limit = 100 } = req.query;

        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 500);
        const offset = (pageNum - 1) * limitNum;

        const where = {};

        if (search.trim()) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search.trim()}%` } },
                { description: { [Op.like]: `%${search.trim()}%` } },
                { seoKeywords: { [Op.like]: `%${search.trim()}%` } },
            ];
        }

        if (status) where.status = status;
        if (isFeatured !== undefined) where.isFeatured = isFeatured === "true";
        if (market?.trim()) {
            const normalizedMarket = market.trim().toLowerCase();
            where.market =
                includeGlobal === "true"
                    ? { [Op.in]: [normalizedMarket, "global"] }
                    : normalizedMarket;
        }

        const total = await JobIndustry.count({ where });

        const items = await JobIndustry.findAll({
            where,
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
        console.error("❌ listIndustries error:", err);
        res.status(500).json({ error: "Failed to fetch job industries" });
    }
};

exports.getIndustry = async (req, res) => {
    try {
        const identifier = req.params.slugOrId;

        const where = /^\d+$/.test(String(identifier))
            ? { id: Number(identifier) }
            : { slug: identifier };

        if (!where.id && req.query.market?.trim()) {
            where.market = req.query.market.trim().toLowerCase();
        }

        const industry = await JobIndustry.findOne({ where });

        if (!industry) {
            return res.status(404).json({ error: "Job industry not found" });
        }

        res.json(industry);
    } catch (err) {
        console.error("❌ getIndustry error:", err);
        res.status(500).json({ error: "Failed to fetch job industry" });
    }
};

exports.createIndustry = async (req, res) => {
    try {
        const payload = await normalizePayload(req.body);

        const industry = await JobIndustry.create(payload);

        res.status(201).json(industry);
    } catch (err) {
        console.error("❌ createIndustry error:", err);
        res.status(400).json({ error: err.message || "Failed to create job industry" });
    }
};

exports.updateIndustry = async (req, res) => {
    try {
        const industry = await JobIndustry.findByPk(req.params.id);

        if (!industry) {
            return res.status(404).json({ error: "Job industry not found" });
        }

        const payload = await normalizePayload(
            {
                ...industry.toJSON(),
                ...req.body,
            },
            industry.id
        );

        await industry.update(payload);

        res.json(industry);
    } catch (err) {
        console.error("❌ updateIndustry error:", err);
        res.status(400).json({ error: err.message || "Failed to update job industry" });
    }
};

exports.deleteIndustry = async (req, res) => {
    try {
        const industry = await JobIndustry.findByPk(req.params.id);

        if (!industry) {
            return res.status(404).json({ error: "Job industry not found" });
        }

        const linkedJobs = await Job.count({
            where: { jobIndustryId: industry.id },
        });

        if (linkedJobs > 0) {
            return res.status(400).json({
                error: `Cannot delete this industry because ${linkedJobs} jobs are linked to it.`,
            });
        }

        await industry.destroy();

        res.json({ message: "Job industry deleted successfully" });
    } catch (err) {
        console.error("❌ deleteIndustry error:", err);
        res.status(500).json({ error: "Failed to delete job industry" });
    }
};
