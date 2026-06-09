const express = require("express");
const router = express.Router();
const subscriptionController = require("../controllers/subscriptionController");
const { authMiddleware, adminMiddleware, employerOrAdminMiddleware, optionalAuth } = require("../middlewares/authMiddleware");

// 🔒 Admin Routes
router.post("/", authMiddleware, adminMiddleware, subscriptionController.createSubscription);
router.get("/", authMiddleware, adminMiddleware, subscriptionController.getAllSubscriptions);
router.put("/:id/cancel", authMiddleware, adminMiddleware, subscriptionController.cancelSubscription);

// 🏢 Company Route
router.get("/me", authMiddleware, subscriptionController.getCompanySubscription);
router.post("/subscribe", authMiddleware, employerOrAdminMiddleware, subscriptionController.subscribeSelf);
router.post("/checkout/session", authMiddleware, employerOrAdminMiddleware, subscriptionController.createCheckoutSession);
// 🧑‍💻 Candidate checkout/status
router.post("/candidate/checkout-session", optionalAuth, subscriptionController.createCandidateCheckoutSession);
router.get("/candidate/me", authMiddleware, subscriptionController.getCandidateSubscription);

module.exports = router;
