"use strict";
const express = require("express");
const router = express.Router();
const controller = require("../controllers/jobCategoryController");
const mediaController = require("../controllers/mediaController");
const { authMiddleware, adminMiddleware } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");

// Public list/get
router.get("/", controller.listCategories);
router.get("/:slugOrId", controller.getCategory);

// Admin manage
router.post("/", authMiddleware, adminMiddleware, controller.createCategory);
router.put("/:id", authMiddleware, adminMiddleware, controller.updateCategory);
router.delete("/:id", authMiddleware, adminMiddleware, controller.deleteCategory);

const setJobCategoriesFolder = (req, _res, next) => {
    req.uploadFolder = "job-categories";
    next();
};

router.post(
    "/media/upload",
    authMiddleware,
    adminMiddleware,
    setJobCategoriesFolder,
    upload.single("image"),
    mediaController.uploadImage
);

module.exports = router;
