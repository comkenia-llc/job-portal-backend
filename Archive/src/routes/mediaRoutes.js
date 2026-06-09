"use strict";
const express = require("express");
const router = express.Router();
const mediaController = require("../controllers/mediaController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");

const setUploadFolder = (req, _res, next) => {
    const raw = req.query.folder || "media";
    const safe = String(raw).toLowerCase().replace(/[^a-z0-9_-]/g, "");
    req.uploadFolder = safe || "media";
    next();
};

router.post(
    "/upload",
    authMiddleware,
    setUploadFolder,
    upload.single("image"),
    mediaController.uploadImage
);

module.exports = router;
