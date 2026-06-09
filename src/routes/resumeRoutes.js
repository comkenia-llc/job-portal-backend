const express = require("express");
const router = express.Router();
const resumeController = require("../controllers/resumeController");
const { authMiddleware, optionalAuth } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");

// 🔒 Authenticated routes
router.get("/", authMiddleware, resumeController.getUserResumes);
router.post("/", authMiddleware, resumeController.createResume);
router.put("/:id", authMiddleware, resumeController.updateResume);
router.post("/save", authMiddleware, resumeController.quickSaveResume);

router.post(
    "/upload-photo",
    authMiddleware,
    (req, res, next) => {
        req.uploadFolder = "resumes"; // 🧠 store inside /uploads/resumes
        next();
    },
    upload.single("photo"),
    async (req, res) => {
        try {
            if (!req.file) return res.status(400).json({ error: "No file uploaded" });

            const filePath = `/uploads/resumes/${req.file.filename}`;

            res.json({ photoUrl: filePath });
        } catch (err) {
            console.error("❌ Upload photo error:", err);
            res.status(500).json({ error: "Failed to upload photo" });
        }
    }
);

router.delete("/:id", authMiddleware, resumeController.deleteResume);
router.patch("/toggle-public/:id", authMiddleware, resumeController.togglePublic);
router.patch("/set-default/:id", authMiddleware, resumeController.setDefaultResume);
router.get("/pdf/:id", authMiddleware, resumeController.generatePdf);

// 🌍 Public access (view via slug)
router.get("/:slug", optionalAuth, resumeController.getResumeBySlug);

module.exports = router;
