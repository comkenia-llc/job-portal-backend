const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authMiddleware, adminMiddleware } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");

// Public
router.get("/register/check", userController.checkRegistrationAvailability);
router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/logout", userController.logout);
router.post("/verify-email", userController.verifyEmail);
router.post("/resend-verification-code", userController.resendVerificationCode);
router.post("/forgot-password", userController.forgotPassword);
router.post("/reset-password", userController.resetPassword);
// Authenticated
router.get("/me", authMiddleware, userController.me);
router.put("/me/profile",  authMiddleware, userController.updateProfile);
router.put("/me/password", authMiddleware, userController.updatePassword);
router.post(
    "/me/avatar",
    authMiddleware,
    (req, res, next) => {
        const rawId = req.user?.id;
        const userId = typeof rawId === "object" && rawId?.id ? rawId.id : rawId;
        req.uploadFolder = `users/${userId || "misc"}`;
        next();
    },
    upload.single("avatar"),
    userController.uploadAvatar
);

router.post(
    "/:id/avatar",
    authMiddleware,
    adminMiddleware,
    (req, res, next) => {
        req.uploadFolder = `users/${req.params.id || "misc"}`;
        next();
    },
    upload.single("avatar"),
    userController.uploadAvatarAdmin
);

// Admin-only
router.get("/", authMiddleware, adminMiddleware, userController.listUsers);
router.put("/:id", authMiddleware, adminMiddleware, userController.updateUser);
router.delete("/:id", authMiddleware, adminMiddleware, userController.deleteUser);

module.exports = router;
