"use strict";

const express = require("express");
const router = express.Router();
const candidateController = require("../controllers/candidateController");
const { optionalAuth } = require("../middlewares/authMiddleware");

// Single candidate by slug/username (public)
router.get("/:slug", optionalAuth, candidateController.getCandidateBySlug);

// Public/optional auth listing (employers/admins can still filter)
router.get("/", optionalAuth, candidateController.listCandidates);

module.exports = router;
