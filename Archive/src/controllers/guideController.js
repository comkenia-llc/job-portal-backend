const { Guide, User } = require("../models");
const { Op } = require("sequelize");

const slugifyValue = (value = "") =>
    value
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 120);

const generateUniqueSlug = async (rawValue, excludeId = null) => {
    const base = slugifyValue(rawValue) || `guide-${Date.now()}`;
    let slug = base;
    let counter = 1;

    while (
        await Guide.findOne({
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

const normalizeJsonField = (raw) => {
    if (raw === null || raw === undefined) return null;
    if (Array.isArray(raw) || typeof raw === "object") {
        return JSON.stringify(raw);
    }
    if (typeof raw === "string") {
        const trimmed = raw.trim();
        if (!trimmed) return null;
        try {
            const parsed = JSON.parse(trimmed);
            return JSON.stringify(parsed);
        } catch (_) {
            return null;
        }
    }
    return null;
};

const serializeGuide = (guide) => {
    if (!guide) return null;
    const data = guide.toJSON();
    if (data.author) {
        data.author = {
            id: data.author.id,
            username: data.author.username,
            firstName: data.author.firstName,
            lastName: data.author.lastName,
        };
    }
    return data;
};

exports.listPublishedGuides = async (req, res) => {
    try {
        const page = parseInt(req.query.page || "1", 10);
        const limit = parseInt(req.query.limit || "12", 10);
        const offset = (page - 1) * limit;
        const search = (req.query.search || "").trim();
        const type = (req.query.type || "").trim();

        const where = { status: "published" };
        if (type) where.type = type;
        if (search) {
            where[Op.and] = [
                {
                    [Op.or]: [
                        { title: { [Op.like]: `%${search}%` } },
                        { summary: { [Op.like]: `%${search}%` } },
                    ],
                },
            ];
        }

        const { rows, count } = await Guide.findAndCountAll({
            where,
            include: [{ model: User, as: "author", attributes: ["id", "username", "firstName", "lastName"] }],
            order: [["publishedAt", "DESC"]],
            offset,
            limit,
        });

        res.json({
            items: rows.map(serializeGuide),
            page,
            total: count,
            totalPages: Math.ceil(count / Math.max(limit, 1)),
        });
    } catch (err) {
        console.error("❌ listPublishedGuides error:", err);
        res.status(500).json({ error: "Failed to load guides" });
    }
};

exports.getGuideByTypeAndSlug = async (req, res) => {
    try {
        const { type, slug } = req.params;
        const guide = await Guide.findOne({
            where: { type, slug, status: "published" },
            include: [{ model: User, as: "author", attributes: ["id", "username", "firstName", "lastName"] }],
        });
        if (!guide) return res.status(404).json({ error: "Guide not found" });
        res.json(serializeGuide(guide));
    } catch (err) {
        console.error("❌ getGuideByTypeAndSlug error:", err);
        res.status(500).json({ error: "Failed to load guide" });
    }
};

exports.previewGuideByTypeAndSlug = async (req, res) => {
    try {
        const { type, slug } = req.params;
        const guide = await Guide.findOne({
            where: { type, slug },
            include: [{ model: User, as: "author", attributes: ["id", "username", "firstName", "lastName"] }],
        });
        if (!guide) return res.status(404).json({ error: "Guide not found" });
        res.json(serializeGuide(guide));
    } catch (err) {
        console.error("❌ previewGuideByTypeAndSlug error:", err);
        res.status(500).json({ error: "Failed to load guide preview" });
    }
};

exports.listAllGuides = async (req, res) => {
    try {
        const page = parseInt(req.query.page || "1", 10);
        const limit = parseInt(req.query.limit || "20", 10);
        const offset = (page - 1) * limit;
        const search = (req.query.search || "").trim();
        const type = (req.query.type || "").trim();
        const status = (req.query.status || "").trim();

        const where = {};
        if (type) where.type = type;
        if (status) where.status = status;
        if (search) {
            where[Op.and] = [
                {
                    [Op.or]: [
                        { title: { [Op.like]: `%${search}%` } },
                        { summary: { [Op.like]: `%${search}%` } },
                    ],
                },
            ];
        }

        const { rows, count } = await Guide.findAndCountAll({
            where,
            include: [{ model: User, as: "author", attributes: ["id", "username", "firstName", "lastName"] }],
            order: [["updatedAt", "DESC"]],
            offset,
            limit,
        });

        res.json({
            items: rows.map(serializeGuide),
            page,
            total: count,
            totalPages: Math.ceil(count / Math.max(limit, 1)),
        });
    } catch (err) {
        console.error("❌ listAllGuides error:", err);
        res.status(500).json({ error: "Failed to load guides" });
    }
};

exports.createGuide = async (req, res) => {
    try {
        const {
            type,
            title,
            summary,
            content,
            payload,
            faqs,
            tags,
            coverImage,
            readingMinutes,
            status,
            seoTitle,
            seoDescription,
            seoKeywords,
            canonicalUrl,
            metaImage,
            schemaType,
        } = req.body;

        if (!type || !title) {
            return res.status(400).json({ error: "Type and title are required" });
        }

        const slug = await generateUniqueSlug(title);
        const normalizedStatus = status === "published" ? "published" : "draft";

        const guide = await Guide.create({
            type: type.trim(),
            title: title.trim(),
            slug,
            summary: summary?.trim() || null,
            content: content || null,
            payload: normalizeJsonField(payload),
            faqs: normalizeJsonField(faqs),
            tags: normalizeJsonField(tags),
            coverImage: coverImage?.trim() || null,
            readingMinutes: readingMinutes ? Number(readingMinutes) : null,
            status: normalizedStatus,
            publishedAt: normalizedStatus === "published" ? new Date() : null,
            seoTitle: seoTitle?.trim() || null,
            seoDescription: seoDescription?.trim() || null,
            seoKeywords: seoKeywords?.trim() || null,
            canonicalUrl: canonicalUrl?.trim() || null,
            metaImage: metaImage?.trim() || null,
            schemaType: schemaType?.trim() || null,
            authorId: req.user.id,
        });

        res.status(201).json(serializeGuide(guide));
    } catch (err) {
        console.error("❌ createGuide error:", err);
        res.status(500).json({ error: "Failed to create guide" });
    }
};

exports.updateGuide = async (req, res) => {
    try {
        const guide = await Guide.findByPk(req.params.id);
        if (!guide) return res.status(404).json({ error: "Guide not found" });

        const {
            type,
            title,
            summary,
            content,
            payload,
            faqs,
            tags,
            coverImage,
            readingMinutes,
            status,
            seoTitle,
            seoDescription,
            seoKeywords,
            canonicalUrl,
            metaImage,
            schemaType,
        } = req.body;

        if (title && title.trim() !== guide.title) {
            guide.slug = await generateUniqueSlug(title, guide.id);
            guide.title = title.trim();
        }
        if (type) guide.type = type.trim();
        if (summary !== undefined) guide.summary = summary?.trim() || null;
        if (content !== undefined) guide.content = content || null;
        if (payload !== undefined) guide.payload = normalizeJsonField(payload);
        if (faqs !== undefined) guide.faqs = normalizeJsonField(faqs);
        if (tags !== undefined) guide.tags = normalizeJsonField(tags);
        if (coverImage !== undefined) guide.coverImage = coverImage?.trim() || null;
        if (readingMinutes !== undefined) {
            guide.readingMinutes = readingMinutes ? Number(readingMinutes) : null;
        }
        if (seoTitle !== undefined) guide.seoTitle = seoTitle?.trim() || null;
        if (seoDescription !== undefined) guide.seoDescription = seoDescription?.trim() || null;
        if (seoKeywords !== undefined) guide.seoKeywords = seoKeywords?.trim() || null;
        if (canonicalUrl !== undefined) guide.canonicalUrl = canonicalUrl?.trim() || null;
        if (metaImage !== undefined) guide.metaImage = metaImage?.trim() || null;
        if (schemaType !== undefined) guide.schemaType = schemaType?.trim() || null;

        if (status) {
            const normalizedStatus = status === "published" ? "published" : "draft";
            if (normalizedStatus !== guide.status) {
                guide.status = normalizedStatus;
                guide.publishedAt = normalizedStatus === "published" ? new Date() : null;
            }
        }

        await guide.save();
        res.json(serializeGuide(guide));
    } catch (err) {
        console.error("❌ updateGuide error:", err);
        res.status(500).json({ error: "Failed to update guide" });
    }
};

exports.deleteGuide = async (req, res) => {
    try {
        const guide = await Guide.findByPk(req.params.id);
        if (!guide) return res.status(404).json({ error: "Guide not found" });
        await guide.destroy();
        res.json({ message: "Guide deleted" });
    } catch (err) {
        console.error("❌ deleteGuide error:", err);
        res.status(500).json({ error: "Failed to delete guide" });
    }
};

exports.uploadGuideImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "Image file is required" });
        }

        const relativePath = `/uploads/guides/${req.file.filename}`;
        res.status(201).json({
            path: relativePath,
        });
    } catch (err) {
        console.error("❌ uploadGuideImage error:", err);
        res.status(500).json({ error: "Failed to upload image" });
    }
};
