const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authMiddleware, adminMiddleware } = require("../middlewares/authMiddleware");

// Public
router.post("/register", userController.register);
router.post("/login", userController.login);

// Authenticated
router.get("/me", authMiddleware, userController.me);

// Admin-only
router.get("/", authMiddleware, adminMiddleware, userController.listUsers);
router.put("/:id", authMiddleware, adminMiddleware, userController.updateUser);
router.delete("/:id", authMiddleware, adminMiddleware, userController.deleteUser);

module.exports = router;
