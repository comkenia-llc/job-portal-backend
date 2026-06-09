"use strict";

const express = require("express");
const router = express.Router();
const controller = require("../controllers/skillCategoryController");
const { authMiddleware, adminMiddleware } = require("../middlewares/authMiddleware");

// Public
router.get("/", controller.listCategories);
router.get("/:slugOrId", controller.getCategory);

// Admin
router.post("/", authMiddleware, adminMiddleware, controller.createCategory);
router.put("/:id", authMiddleware, adminMiddleware, controller.updateCategory);

module.exports = router;
