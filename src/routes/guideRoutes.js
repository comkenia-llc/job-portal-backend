const express = require("express");
const router = express.Router();
const guideController = require("../controllers/guideController");
const { authMiddleware, adminMiddleware } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");

const setGuideFolder = (req, _res, next) => {
    req.uploadFolder = "guides";
    next();
};

const imageUpload = upload.single("image");

// Public routes
router.get("/", guideController.listPublishedGuides);
router.get("/public/:type/:slug", guideController.getGuideByTypeAndSlug);

// Admin routes
router.get("/admin/list", authMiddleware, adminMiddleware, guideController.listAllGuides);
router.get("/preview/:type/:slug", authMiddleware, adminMiddleware, guideController.previewGuideByTypeAndSlug);
router.post(
    "/media/upload",
    authMiddleware,
    adminMiddleware,
    setGuideFolder,
    imageUpload,
    guideController.uploadGuideImage
);
router.post("/", authMiddleware, adminMiddleware, guideController.createGuide);
router.put("/:id", authMiddleware, adminMiddleware, guideController.updateGuide);
router.delete("/:id", authMiddleware, adminMiddleware, guideController.deleteGuide);

module.exports = router;