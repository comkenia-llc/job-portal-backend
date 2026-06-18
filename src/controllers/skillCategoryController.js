"use strict";
const { SkillCategory } = require("../models");
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
        await SkillCategory.findOne({
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

exports.listCategories = async (req, res) => {
    try {
        const { search, limit = 200 } = req.query;
        const where = {};
        if (search?.trim()) {
            const term = search.trim();
            where[Op.or] = [
                { name: { [Op.like]: `%${term}%` } },
                { description: { [Op.like]: `%${term}%` } },
            ];
        }
        const categories = await SkillCategory.findAll({
            where,
            order: [
                ["isFeatured", "DESC"],
                ["name", "ASC"],
            ],
            limit: Math.min(Math.max(parseInt(limit, 10) || 50, 1), 50),
        });
        res.json(categories);
    } catch (err) {
        console.error("❌ listCategories error", err);
        res.status(500).json({ error: "Failed to fetch skill categories" });
    }
};

exports.getCategory = async (req, res) => {
    try {
        const identifier = req.params.slugOrId;
        const where = /^\d+$/.test(identifier) ? { id: Number(identifier) } : { slug: identifier };
        const category = await SkillCategory.findOne({ where });
        if (!category) return res.status(404).json({ error: "Skill category not found" });
        res.json(category);
    } catch (err) {
        console.error("❌ getCategory error", err);
        res.status(500).json({ error: "Failed to fetch skill category" });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const { name, slug, description, isFeatured } = req.body;
        if (!name?.trim()) return res.status(400).json({ error: "Name is required" });
        const finalSlug = await ensureSlug(name, slug);
        const category = await SkillCategory.create({
            name: name.trim(),
            slug: finalSlug,
            description: description?.trim() || null,
            isFeatured: isFeatured === "true" || isFeatured === true,
        });
        res.status(201).json(category);
    } catch (err) {
        console.error("❌ createCategory error", err);
        res.status(400).json({ error: err.message || "Failed to create category" });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const category = await SkillCategory.findByPk(req.params.id);
        if (!category) return res.status(404).json({ error: "Skill category not found" });

        const { name, slug, description, isFeatured } = req.body;
        const finalSlug = await ensureSlug(name || category.name, slug || category.slug, category.id);

        await category.update({
            name: name?.trim() || category.name,
            slug: finalSlug,
            description: description?.trim() || category.description,
            isFeatured: isFeatured === "true" || isFeatured === true || category.isFeatured,
        });

        res.json(category);
    } catch (err) {
        console.error("❌ updateCategory error", err);
        res.status(400).json({ error: err.message || "Failed to update category" });
    }
};

