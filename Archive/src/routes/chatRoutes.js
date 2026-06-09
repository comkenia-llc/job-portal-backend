"use strict";

const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const { authMiddleware } = require("../middlewares/authMiddleware");

router.use(authMiddleware);

router.get("/conversations", chatController.listConversations);
router.post("/conversations", chatController.createConversation);
router.get("/conversations/:id/messages", chatController.listMessages);
router.post("/conversations/:id/messages", chatController.sendMessage);
router.post("/messages/:id/read", chatController.markRead);
router.delete("/conversations/:id", chatController.deleteConversation);
router.get("/search", chatController.searchPeople);

module.exports = router;
