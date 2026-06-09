const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const controller = require("../controllers/globalSettingsController");

// ✅ Fetch existing settings
router.get("/", controller.getSettings);

// ✅ Update global settings
router.put(
    "/",
    (req, res, next) => {
        req.uploadFolder = "global"; // store in /uploads/global
        next();
    },
    upload.fields([
        { name: "logo", maxCount: 1 },
        { name: "favicon", maxCount: 1 },
        { name: "banner_image", maxCount: 1 },
    ]),
    controller.updateSettings
);

module.exports = router;
