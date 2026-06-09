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

// Admin routes
router.use(authMiddleware, adminMiddleware);
router.get("/admin/list", guideController.listAllGuides);
router.get("/preview/:type/:slug", guideController.previewGuideByTypeAndSlug);
router.post("/media/upload", setGuideFolder, imageUpload, guideController.uploadGuideImage);
router.post("/", guideController.createGuide);
router.put("/:id", guideController.updateGuide);
router.delete("/:id", guideController.deleteGuide);

// Public route that must come last
router.get("/:type/:slug", guideController.getGuideByTypeAndSlug);

module.exports = router;
