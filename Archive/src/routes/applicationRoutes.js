const express = require("express");
const router = express.Router();
const applicationController = require("../controllers/applicationController");
const { authMiddleware, adminMiddleware } = require("../middlewares/authMiddleware");

router.post("/", authMiddleware, applicationController.applyToJob);
router.get("/", authMiddleware, applicationController.listUserApplications);
router.get("/by-job/:jobId", authMiddleware, applicationController.getApplicationByJob);
router.get("/admin/all", authMiddleware, adminMiddleware, applicationController.listAllApplicationsAdmin);
router.delete("/:id", authMiddleware, applicationController.withdrawApplication);

module.exports = router;
