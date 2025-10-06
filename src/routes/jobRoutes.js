const express = require("express");
const router = express.Router();
const jobController = require("../controllers/jobController");
const { authMiddleware, employerOrAdminMiddleware, adminMiddleware } = require("../middlewares/authMiddleware");

// Create job → only employer/admin
router.post("/", authMiddleware, employerOrAdminMiddleware, jobController.createJob);

// List all jobs → public
router.get("/", jobController.listJobs);

// in routes/jobRoutes.js
router.get("/company/:companyId", jobController.listJobsByCompany);


// Get single job → public
router.get("/:id", jobController.getJob);

// Update job → employer who posted it or admin
router.put("/:id", authMiddleware, employerOrAdminMiddleware, jobController.updateJob);

// Delete job → admin only (safer)
router.delete("/:id", authMiddleware, adminMiddleware, jobController.deleteJob);

module.exports = router;
