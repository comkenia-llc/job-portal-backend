const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authMiddleware");
const c = require("../controllers/jobAlertController");

router.get("/", authMiddleware, c.getAlerts);
router.post("/", authMiddleware, c.createAlert);
router.put("/:id", authMiddleware, c.updateAlert);
router.delete("/:id", authMiddleware, c.deleteAlert);

module.exports = router;
