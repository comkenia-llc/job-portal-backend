const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authMiddleware");
const aiController = require("../controllers/aiController");

router.post("/resume-summary", authMiddleware, aiController.generateResumeSummary);

module.exports = router;
