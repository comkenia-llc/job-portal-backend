const express = require("express");
const router = express.Router();
const controller = require("../controllers/locationController");
const { authMiddleware, adminMiddleware } = require("../middlewares/authMiddleware");

router.post("/", authMiddleware, adminMiddleware, controller.create);
router.get("/", controller.list);
router.get("/search", controller.searchLocations);
router.delete("/:id", authMiddleware, adminMiddleware, controller.delete);

module.exports = router;
