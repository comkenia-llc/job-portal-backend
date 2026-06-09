const express = require("express");
const router = express.Router();
const employerController = require("../controllers/employerController");
const { authMiddleware, employerOrAdminMiddleware } = require("../middlewares/authMiddleware");
const { requireActiveSubscription } = require("../middlewares/subscriptionMiddleware");

// ✅ Public route must come BEFORE auth middleware
router.get("/slug/:slug", employerController.getEmployerBySlug);

// 🔒 Protected routes after this
router.use(authMiddleware, employerOrAdminMiddleware, requireActiveSubscription);

router.get("/jobs", employerController.getEmployerJobs);
router.get("/jobs/:identifier/applications", employerController.getJobApplications);

router.patch("/applications/:id/status", employerController.updateApplicationStatus);
router.patch("/applications/:id/note", employerController.updateApplicationNote);

router.post("/applications/:id/interviews", employerController.scheduleInterview);
router.get("/interviews", employerController.listInterviews);

module.exports = router;