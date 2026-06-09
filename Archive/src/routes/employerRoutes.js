const express = require("express");
const router = express.Router();
const employerController = require("../controllers/employerController");
const { authMiddleware, employerOrAdminMiddleware } = require("../middlewares/authMiddleware");
const { requireActiveSubscription } = require("../middlewares/subscriptionMiddleware");

// All routes require auth + employer/admin role + active subscription (except admin bypass inside middleware)
router.use(authMiddleware, employerOrAdminMiddleware, requireActiveSubscription);

router.get("/jobs", employerController.getEmployerJobs);
router.get("/jobs/:identifier/applications", employerController.getJobApplications);

router.patch("/applications/:id/status", employerController.updateApplicationStatus);
router.patch("/applications/:id/note", employerController.updateApplicationNote);

router.post("/applications/:id/interviews", employerController.scheduleInterview);
router.get("/interviews", employerController.listInterviews);

module.exports = router;
