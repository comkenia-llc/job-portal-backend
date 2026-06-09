const express = require("express");
const router = express.Router();
const planController = require("../controllers/planController");
const { authMiddleware, adminMiddleware } = require("../middlewares/authMiddleware");

// 🌐 Public
router.get("/public", planController.listPublicPlans);

// 🔒 Admin-only routes
router.post("/", authMiddleware, adminMiddleware, planController.createPlan);
router.get("/", authMiddleware, adminMiddleware, planController.getAllPlans);
// ⚙️ Helper: Get all available features (for Plan creation UI)
router.get("/admin/features/all", authMiddleware, adminMiddleware, planController.getFeatureDefinitions);
router.get("/:id", authMiddleware, adminMiddleware, planController.getPlanById);
router.put("/:id", authMiddleware, adminMiddleware, planController.updatePlan);
router.delete("/:id", authMiddleware, adminMiddleware, planController.deletePlan);

module.exports = router;
