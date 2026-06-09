const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const { authMiddleware } = require("../middlewares/authMiddleware");

router.get("/overview", authMiddleware, dashboardController.getDashboardOverview);

module.exports = router;
