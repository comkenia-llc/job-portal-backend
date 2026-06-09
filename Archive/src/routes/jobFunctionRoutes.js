const express = require("express");
const router = express.Router();
const controller = require("../controllers/jobFunctionController");
const { authMiddleware, adminMiddleware } = require("../middlewares/authMiddleware");

// Public
router.get("/", controller.listFunctions);
router.get("/:slugOrId", controller.getFunction);

// Admin
router.post("/", authMiddleware, adminMiddleware, controller.createFunction);
router.put("/:id", authMiddleware, adminMiddleware, controller.updateFunction);

module.exports = router;
