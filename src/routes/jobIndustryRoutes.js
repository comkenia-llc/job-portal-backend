"use strict";

const express = require("express");
const router = express.Router();

const jobIndustryController = require("../controllers/jobIndustryController");
const {authMiddleware} = require("../middlewares/authMiddleware");

router.get("/", jobIndustryController.listIndustries);
router.get("/:slugOrId", jobIndustryController.getIndustry);

router.post("/", authMiddleware, jobIndustryController.createIndustry);
router.put("/:id", authMiddleware, jobIndustryController.updateIndustry);
router.delete("/:id", authMiddleware, jobIndustryController.deleteIndustry);

module.exports = router;