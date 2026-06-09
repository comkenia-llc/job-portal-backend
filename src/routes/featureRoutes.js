const express = require("express");
const router = express.Router();
const featureController = require("../controllers/featureController");
const { adminMiddleware, authMiddleware } = require("../middlewares/authMiddleware");

// 🔒 Admin-only routes
router.post("/", authMiddleware, adminMiddleware, featureController.createFeature);
router.get("/", authMiddleware, adminMiddleware, featureController.getAllFeatures);
router.put("/:id", authMiddleware, adminMiddleware, featureController.updateFeature);
router.delete("/:id", authMiddleware, adminMiddleware, featureController.deleteFeature);

module.exports = router;
