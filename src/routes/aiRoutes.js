const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authMiddleware");
const aiController = require("../controllers/aiController");

router.post("/resume-summary", authMiddleware, aiController.generateResumeSummary);
router.post("/ats-analyze", authMiddleware, aiController.analyzeAts);
router.post("/cover-letter", authMiddleware, aiController.generateCoverLetter);
router.post("/improve-bullets", authMiddleware, aiController.improveBullets);

module.exports = router;
