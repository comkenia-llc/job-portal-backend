const express = require("express");
const router = express.Router();

const walkinController = require("../controllers/walkin-controller");
const { authMiddleware, adminMiddleware } = require("../middlewares/authMiddleware");

router.get("/", walkinController.listWalkInInterviews);
router.get("/:identifier", walkinController.getWalkInInterview);

router.post("/", authMiddleware, walkinController.createWalkInInterview);
router.put("/:id", authMiddleware, walkinController.updateWalkInInterview);
router.delete("/:id", authMiddleware, walkinController.deleteWalkInInterview);

module.exports = router;