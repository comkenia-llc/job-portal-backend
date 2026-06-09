const express = require("express");
const router = express.Router();
const { getAdminStats, getAnalytics } = require("../controllers/adminController");
const { authMiddleware, adminMiddleware } = require("../middlewares/authMiddleware");

// ✅ Admin-only stats endpoint
router.get("/stats", authMiddleware, adminMiddleware, getAdminStats);
router.get("/analytics", authMiddleware, adminMiddleware, getAnalytics);

module.exports = router;
