const { BlogPost, User } = require("../models");
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
        .slice(0, 90);

const generateUniqueSlug = async (rawValue, excludeId = null) => {
    const base = slugifyValue(rawValue) || `post-${Date.now()}`;
    let slug = base;
    let counter = 1;

    while (
        await BlogPost.findOne({
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

const serializePost = (post) => {
    if (!post) return null;
    const data = post.toJSON();
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

const stripHtml = (value = "") =>
    value
        .toString()
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const buildExcerpt = (rawExcerpt, fallbackContent) => {
    const text = stripHtml(rawExcerpt || fallbackContent || "");
    return text ? text.slice(0, 240) : null;
};

const normalizeFaqs = (rawFaqs) => {
    if (!rawFaqs) return null;
    if (Array.isArray(rawFaqs)) return JSON.stringify(rawFaqs);
    if (typeof rawFaqs === "string") {
        const trimmed = rawFaqs.trim();
        if (!trimmed) return null;
        try {
            const parsed = JSON.parse(trimmed);
            return Array.isArray(parsed) ? JSON.stringify(parsed) : null;
        } catch (_) {
            return null;
        }
    }
    return null;
};

const buildAbsoluteUrl = (req, relativePath) => {
    if (!relativePath) return null;
    const protocol = req.headers["x-forwarded-proto"] || req.protocol;
    const host = req.get("host");
    return host ? `${protocol}://${host}${relativePath}` : relativePath;
};

exports.createPost = async (req, res) => {
    try {
        const { title, content, excerpt, coverImage, status, faqs } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: "Title and content are required" });
        }

        const slug = await generateUniqueSlug(title);
        const normalizedStatus = status === "published" ? "published" : "draft";
        const coverPath = req.file
            ? `/uploads/blog/${req.file.filename}`
            : coverImage?.trim() || null;
        const normalizedExcerpt = buildExcerpt(excerpt, content);

        const post = await BlogPost.create({
            title: title.trim(),
            slug,
            excerpt: normalizedExcerpt,
            content,
            coverImage: coverPath,
            faqs: normalizeFaqs(faqs),
            status: normalizedStatus,
            publishedAt: normalizedStatus === "published" ? new Date() : null,
            authorId: req.user.id,
        });

        res.status(201).json(post);
    } catch (err) {
        console.error("❌ createPost error:", err);
        res.status(500).json({ error: "Failed to publish post" });
    }
};

exports.updatePost = async (req, res) => {
    try {
        const post = await BlogPost.findByPk(req.params.id);
        if (!post) return res.status(404).json({ error: "Post not found" });

        if (req.user.role !== "admin" && req.user.id !== post.authorId) {
            return res.status(403).json({ error: "Not authorized to update this post" });
        }

        const { title, content, excerpt, coverImage, status, removeCover, faqs } = req.body;

        if (title && title.trim() !== post.title) {
            post.slug = await generateUniqueSlug(title, post.id);
            post.title = title.trim();
        }
        if (content) post.content = content;
        if (excerpt !== undefined) {
            post.excerpt = buildExcerpt(excerpt, content || post.content);
        }
        if (faqs !== undefined) {
            post.faqs = normalizeFaqs(faqs);
        }
        if (req.file) {
            post.coverImage = `/uploads/blog/${req.file.filename}`;
        } else if (removeCover === "true") {
            post.coverImage = null;
        } else if (coverImage !== undefined) {
            post.coverImage = coverImage?.trim() || post.coverImage;
        }

        if (status) {
            const normalizedStatus = status === "published" ? "published" : "draft";
            if (normalizedStatus !== post.status) {
                post.status = normalizedStatus;
                post.publishedAt = normalizedStatus === "published" ? new Date() : null;
            }
        }

        await post.save();
        res.json(post);
    } catch (err) {
        console.error("❌ updatePost error:", err);
        res.status(500).json({ error: "Failed to update post" });
    }
};

exports.deletePost = async (req, res) => {
    try {
        const post = await BlogPost.findByPk(req.params.id);
        if (!post) return res.status(404).json({ error: "Post not found" });

        if (req.user.role !== "admin" && req.user.id !== post.authorId) {
            return res.status(403).json({ error: "Not authorized to delete this post" });
        }

        await post.destroy();
        res.json({ message: "Post deleted" });
    } catch (err) {
        console.error("❌ deletePost error:", err);
        res.status(500).json({ error: "Failed to delete post" });
    }
};

exports.listPublishedPosts = async (req, res) => {
    try {
        const page = parseInt(req.query.page || "1", 10);
        const limit = parseInt(req.query.limit || "9", 10);
        const offset = (page - 1) * limit;
        const search = (req.query.search || "").trim();

        const where = { status: "published" };
        if (search) {
            where[Op.and] = [
                {
                    [Op.or]: [
                        { title: { [Op.like]: `%${search}%` } },
                        { excerpt: { [Op.like]: `%${search}%` } },
                        { content: { [Op.like]: `%${search}%` } },
                    ],
                },
            ];
        }

        const { rows, count } = await BlogPost.findAndCountAll({
            where,
            include: [{ model: User, as: "author", attributes: ["id", "username", "firstName", "lastName"] }],
            order: [["publishedAt", "DESC"]],
            offset,
            limit,
        });

        res.json({
            posts: rows.map(serializePost),
            page,
            total: count,
            totalPages: Math.ceil(count / limit),
        });
    } catch (err) {
        console.error("❌ listPublishedPosts error:", err);
        res.status(500).json({ error: "Failed to load posts" });
    }
};

exports.listMyPosts = async (req, res) => {
    try {
        const page = parseInt(req.query.page || "1", 10);
        const limit = parseInt(req.query.limit || "10", 10);
        const offset = (page - 1) * limit;
        const search = (req.query.search || "").trim();

        const where = req.user.role === "admin" ? {} : { authorId: req.user.id };

        if (search) {
            where[Op.and] = [
                ...(where[Op.and] || []),
                {
                    [Op.or]: [
                        { title: { [Op.like]: `%${search}%` } },
                        { excerpt: { [Op.like]: `%${search}%` } },
                        { content: { [Op.like]: `%${search}%` } },
                    ],
                },
            ];
        }

        const { rows, count } = await BlogPost.findAndCountAll({
            where,
            include: [
                {
                    model: User,
                    as: "author",
                    attributes: ["id", "username", "firstName", "lastName"],
                },
            ],
            order: [["createdAt", "DESC"]],
            offset,
            limit,
        });

        res.json({
            posts: rows.map(serializePost),
            page,
            total: count,
            totalPages: Math.ceil(count / Math.max(limit, 1)),
        });
    } catch (err) {
        console.error("❌ listMyPosts error:", err);
        res.status(500).json({ error: "Failed to load posts" });
    }
};

exports.getPostBySlug = async (req, res) => {
    try {
        const post = await BlogPost.findOne({
            where: { slug: req.params.slug, status: "published" },
            include: [{ model: User, as: "author", attributes: ["id", "username", "firstName", "lastName"] }],
        });

        if (!post) return res.status(404).json({ error: "Post not found" });
        res.json(serializePost(post));
    } catch (err) {
        console.error("❌ getPostBySlug error:", err);
        res.status(500).json({ error: "Failed to load post" });
    }
};

exports.uploadInlineImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "Image file is required" });
        }

        const relativePath = `/uploads/blog/${req.file.filename}`;
        const absoluteUrl = buildAbsoluteUrl(req, relativePath);

        res.status(201).json({
            path: relativePath,
            url: absoluteUrl,
        });
    } catch (err) {
        console.error("❌ uploadInlineImage error:", err);
        res.status(500).json({ error: "Failed to upload image" });
    }
};
