"use strict";
const { CompanyCategory } = require("../models");
const { Op } = require("sequelize");

const slugify = (value) =>
    (value || "")
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 90);

const ensureSlug = async (name, providedSlug, excludeId = null) => {
    const base = slugify(providedSlug || name || `category-${Date.now()}`);
    let slug = base;
    let counter = 1;
    while (
        await CompanyCategory.findOne({
            where: {
                slug,
                ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}),
            },
        })
    ) {
        slug = `${base}-${counter++}`;
    }
    return slug;
};

const normalizeFaqs = (raw) => {
    if (!raw) return null;
    if (Array.isArray(raw)) return JSON.stringify(raw);
    if (typeof raw === "string") {
        const trimmed = raw.trim();
        if (!trimmed) return null;
        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) return JSON.stringify(parsed);
        } catch (_) {
            return trimmed;
        }
        return trimmed;
    }
    return null;
};

exports.listCategories = async (req, res) => {
    try {
        const { search, limit = 200, parentId } = req.query;
        const where = {};
        if (search?.trim()) {
            const term = search.trim();
            where[Op.or] = [
                { name: { [Op.like]: `%${term}%` } },
                { description: { [Op.like]: `%${term}%` } },
            ];
        }
        if (parentId !== undefined) {
            where.parentId = parentId === "null" || parentId === "" ? null : parentId;
        }
        const categories = await CompanyCategory.findAll({
            where,
            order: [
                ["isFeatured", "DESC"],
                ["name", "ASC"],
            ],
            limit: Math.min(parseInt(limit, 10) || 200, 500),
        });
        res.json(categories);
    } catch (err) {
        console.error("❌ listCompanyCategories error", err);
        res.status(500).json({ error: "Failed to fetch company categories" });
    }
};

exports.getCategory = async (req, res) => {
    try {
        const identifier = req.params.slugOrId;
        const where = /^\d+$/.test(identifier) ? { id: Number(identifier) } : { slug: identifier };
        const category = await CompanyCategory.findOne({ where });
        if (!category) return res.status(404).json({ error: "Company category not found" });
        res.json(category);
    } catch (err) {
        console.error("❌ getCompanyCategory error", err);
        res.status(500).json({ error: "Failed to fetch company category" });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const { name, slug, description, isFeatured, parentId, content, faqs } = req.body;
        if (!name?.trim()) return res.status(400).json({ error: "Name is required" });
        const normalizedParentId = parentId === "" || parentId === "null" ? null : parentId;
        const finalSlug = await ensureSlug(name, slug);
        const category = await CompanyCategory.create({
            name: name.trim(),
            slug: finalSlug,
            description: description?.trim() || null,
            content: content || null,
            faqs: normalizeFaqs(faqs),
            isFeatured: isFeatured === "true" || isFeatured === true,
            parentId: normalizedParentId || null,
        });
        res.status(201).json(category);
    } catch (err) {
        console.error("❌ createCompanyCategory error:", err);
        res.status(400).json({ error: err.message || "Failed to create company category" });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const category = await CompanyCategory.findByPk(req.params.id);
        if (!category) return res.status(404).json({ error: "Company category not found" });

        const { name, slug, description, isFeatured, parentId, content, faqs } = req.body;
        const normalizedParentId = parentId === "" || parentId === "null" ? null : parentId;
        const finalSlug = await ensureSlug(name || category.name, slug || category.slug, category.id);

        await category.update({
            name: name?.trim() || category.name,
            slug: finalSlug,
            description: description?.trim() || category.description,
            content: content ?? category.content,
            faqs: normalizeFaqs(faqs) ?? category.faqs,
            isFeatured: isFeatured === "true" || isFeatured === true || category.isFeatured,
            parentId: normalizedParentId ?? category.parentId,
        });

        res.json(category);
    } catch (err) {
        console.error("❌ updateCompanyCategory error:", err);
        res.status(400).json({ error: err.message || "Failed to update company category" });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const category = await CompanyCategory.findByPk(req.params.id);
        if (!category) return res.status(404).json({ error: "Company category not found" });
        await category.destroy();
        res.json({ message: "Company category deleted" });
    } catch (err) {
        console.error("❌ deleteCompanyCategory error", err);
        res.status(500).json({ error: "Failed to delete company category" });
    }
};
