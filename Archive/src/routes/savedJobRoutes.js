const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authMiddleware");
const savedJobController = require("../controllers/savedJobController");

router.get("/", authMiddleware, savedJobController.listSavedJobs);
router.post("/", authMiddleware, savedJobController.saveJob);
router.delete("/:jobId", authMiddleware, savedJobController.removeSavedJob);

module.exports = router;
