const { Resume, CompanySubscription } = require("../models");
const { Op } = require("sequelize");
const { nanoid } = require("nanoid");
const jwt = require("jsonwebtoken");
const puppeteer = require("puppeteer");

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

// 📄 Generate PDF via Puppeteer (server-side, vector-quality)
exports.generatePdf = async (req, res) => {
    try {
        const resume = await Resume.findByPk(req.params.id);
        if (!resume) return res.status(404).json({ error: "Resume not found" });
        if (resume.userId !== req.user.id)
            return res.status(403).json({ error: "Unauthorized" });

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const previewUrl = `${frontendUrl}/resumes/preview/${resume.publicSlug}?print=1`;

        const browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
        });
        const page = await browser.newPage();

        // A4 at 96dpi = 794 × 1123px — must be set before navigation
        await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });

        // Set cookies: auth token + pdf_mode (hides site header/footer/ads)
        const token = req.cookies?.token || (req.headers.authorization?.split(" ")[1]);
        const cookiesToSet = [{ name: "pdf_mode", value: "1", url: frontendUrl }];
        if (token) cookiesToSet.push({ name: "token", value: token, url: frontendUrl });

        try {
            for (const c of cookiesToSet) await page.setCookie(c);
        } catch (cookieErr) {
            console.warn("⚠️ Could not set cookies for PDF render:", cookieErr.message);
        }

        await page.goto(previewUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
        // Wait for client-side hydration + fonts
        await new Promise((r) => setTimeout(r, 2500));

        // Direct DOM manipulation — more reliable than CSS class overrides
        await page.evaluate(() => {
            // Remove site chrome entirely
            document.querySelectorAll("header, footer, nav").forEach((el) => el.remove());

            // Reset document
            document.documentElement.style.cssText = "margin:0;padding:0;background:white;";
            document.body.style.cssText = "margin:0;padding:0;background:white;width:100%;";
            const main = document.querySelector("main");
            if (main) main.style.cssText = "padding:0;margin:0;min-height:0;";

            // Fix the print wrapper itself
            const wrapper = document.querySelector(".cv-print-wrapper");
            if (!wrapper) return;
            wrapper.style.cssText = "width:100%;min-height:297mm;background:white;margin:0;padding:0;overflow:visible;";

            // Fix the template root div (direct child = the template's outer container)
            const root = wrapper.firstElementChild;
            if (root) {
                root.style.maxHeight = "none";
                root.style.overflow = "visible";
                root.style.borderRadius = "0";
                root.style.boxShadow = "none";
                root.style.width = "100%";
                root.style.minHeight = "297mm";
            }

            // Walk every descendant: remove computed overflow clipping and max-height
            wrapper.querySelectorAll("*").forEach((el) => {
                const cs = window.getComputedStyle(el);
                if (cs.overflow === "auto" || cs.overflow === "scroll") {
                    el.style.overflow = "visible";
                }
                if (cs.overflowY === "auto" || cs.overflowY === "scroll") {
                    el.style.overflowY = "visible";
                }
                if (cs.maxHeight && cs.maxHeight !== "none") {
                    el.style.maxHeight = "none";
                }
            });
        });

        // Belt-and-suspenders: inject CSS on top of the DOM manipulation
        await page.addStyleTag({
            content: `
                html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
                main { padding: 0 !important; margin: 0 !important; min-height: 0 !important; }
                .cv-print-wrapper { width: 100% !important; min-height: 297mm !important; }
                .cv-print-wrapper, .cv-print-wrapper * { max-height: none !important; }
                .cv-print-wrapper .overflow-auto,
                .cv-print-wrapper .overflow-scroll { overflow: visible !important; }
            `,
        });

        await page.emulateMediaType("print");

        const pdf = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: { top: "0", right: "0", bottom: "0", left: "0" },
        });

        await browser.close();

        const filename = `${(resume.title || "resume").replace(/\s+/g, "_")}.pdf`;
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.send(pdf);
    } catch (err) {
        console.error("❌ generatePdf error:", err);
        res.status(500).json({ error: "Failed to generate PDF" });
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
