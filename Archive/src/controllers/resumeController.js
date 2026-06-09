const { Resume, User, CompanySubscription } = require("../models");
const { Op } = require("sequelize");
const { nanoid } = require("nanoid");
const jwt = require("jsonwebtoken");

const hasActiveSubscription = async (companyId) => {
    if (!companyId) return false;
    const now = new Date();
    const sub = await CompanySubscription.findOne({
        where: {
            company_id: companyId,
            status: "active",
            [Op.or]: [{ end_date: null }, { end_date: { [Op.gte]: now } }],
        },
    });
    return Boolean(sub);
};

const resolveUserFromHeaders = (req) => {
    try {
        const token =
            req.cookies?.token ||
            (req.headers.authorization && req.headers.authorization.split(" ")[1]);
        if (!token) return null;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId =
            typeof decoded.id === "object" && decoded.id.id
                ? decoded.id.id
                : decoded.id;
        return {
            id: userId,
            role: decoded.role,
            companyId: decoded.companyId || null,
        };
    } catch (err) {
        console.warn("⚠️ [resume] optional auth parse failed:", err.message);
        return null;
    }
};

// 🧱 Create new resume
exports.createResume = async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, template } = req.body;

        const publicSlug = nanoid(12);
        const resume = await Resume.create({
            userId,
            title,
            template: template || "modern-yellow",
            publicSlug,
            isPublic: false,
        });

        res.status(201).json(resume);
    } catch (err) {
        console.error("❌ createResume error:", err);
        res.status(500).json({ error: "Server error creating resume" });
    }
};

// 🧭 Get all resumes for logged-in user
exports.getUserResumes = async (req, res) => {
    try {
        const userId = req.user.id;

        const resumes = await Resume.findAll({
            where: { userId },
            order: [["createdAt", "DESC"]],
        });

        // ✅ Always send once and log correctly
        console.log("📦 Resume response:", resumes[0]?.dataValues);
        res.json(resumes);

    } catch (err) {
        console.error("❌ getUserResumes error:", err);
        res.status(500).json({ error: "Failed to fetch resumes" });
    }
};


// 🔍 Get resume by slug (public or private)
// 🌍 Public access (view via slug)
exports.getResumeBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const resume = await Resume.findOne({ where: { publicSlug: slug } });

        if (!resume) return res.status(404).json({ error: "Resume not found" });

        const requester = req.user || resolveUserFromHeaders(req);
        const isOwner = requester?.id === resume.userId;
        const isAdmin = requester?.role === "admin";
        const isEmployer = requester?.role === "employer";
        const employerAllowed = isEmployer && (await hasActiveSubscription(requester.companyId));

        if (resume.isPublic) {
            const safeResume = { ...resume.dataValues, canView: true };
            delete safeResume.userId;
            return res.json(safeResume);
        }

        if (!isOwner && !isAdmin && !employerAllowed) {
            return res.status(403).json({ error: "Access denied" });
        }

        const safeResume = { ...resume.dataValues, canView: true };
        delete safeResume.userId;

        res.json(safeResume);
    } catch (err) {
        console.error("❌ getResumeBySlug error:", err);
        res.status(500).json({ error: "Failed to fetch resume" });
    }
};


// ✏️ Update existing resume
exports.updateResume = async (req, res) => {
    try {
        const { id } = req.params;
        const resume = await Resume.findByPk(id);
        if (!resume) return res.status(404).json({ error: "Resume not found" });

        if (resume.userId !== req.user.id)
            return res.status(403).json({ error: "Unauthorized" });

        await resume.update(req.body);
        res.json(resume);
    } catch (err) {
        console.error("❌ updateResume error:", err);
        res.status(500).json({ error: "Failed to update resume" });
    }
};

// 💾 Quick save (used during editing)
exports.quickSaveResume = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id, ...data } = req.body;

        if (!data.title) data.title = "Untitled Resume";

        // 1️⃣ Try to find an existing resume by ID or fallback by userId
        let resume = null;

        if (id) {
            resume = await Resume.findOne({ where: { id, userId } });
        }

        if (!resume) {
            resume = await Resume.findOne({ where: { userId } });
        }

        // 2️⃣ If found → update
        if (resume) {
            await resume.update(data);
        } else {
            // 3️⃣ If not found → create new
            resume = await Resume.create({
                ...data,
                userId,
                title: data.title || "Untitled Resume",
            });
        }

        res.json(resume);
    } catch (err) {
        console.error("❌ quickSaveResume error:", err);
        res.status(500).json({ error: "Failed to save resume" });
    }
};


// 🧹 Delete
exports.deleteResume = async (req, res) => {
    try {
        const resume = await Resume.findByPk(req.params.id);
        if (!resume) return res.status(404).json({ error: "Not found" });
        if (resume.userId !== req.user.id)
            return res.status(403).json({ error: "Unauthorized" });

        await resume.destroy();
        res.json({ message: "Resume deleted" });
    } catch (err) {
        console.error("❌ deleteResume error:", err);
        res.status(500).json({ error: "Failed to delete" });
    }
};

// 🌍 Toggle public/private
exports.togglePublic = async (req, res) => {
    try {
        const resume = await Resume.findByPk(req.params.id);
        if (!resume) return res.status(404).json({ error: "Not found" });

        resume.isPublic = !resume.isPublic;
        await resume.save();

        res.json({ message: "Visibility updated", isPublic: resume.isPublic });
    } catch (err) {
        console.error("❌ togglePublic error:", err);
        res.status(500).json({ error: "Failed to toggle public state" });
    }
};

// ⭐ Set default
exports.setDefaultResume = async (req, res) => {
    try {
        const userId = req.user.id;
        const resumeId = req.params.id;

        await Resume.update({ isDefault: false }, { where: { userId } });
        await Resume.update({ isDefault: true }, { where: { id: resumeId, userId } });

        res.json({ message: "Default resume set" });
    } catch (err) {
        console.error("❌ setDefaultResume error:", err);
        res.status(500).json({ error: "Failed to set default" });
    }
};
