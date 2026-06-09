const express = require("express");
const router = express.Router();
const controller = require("../controllers/skillController");
const { authMiddleware, adminMiddleware } = require("../middlewares/authMiddleware");

// Public
router.get("/", controller.listSkills);
router.get("/:slugOrId", controller.getSkill);

// Admin
router.post("/", authMiddleware, adminMiddleware, controller.createSkill);
router.put("/:id", authMiddleware, adminMiddleware, controller.updateSkill);

module.exports = router;
