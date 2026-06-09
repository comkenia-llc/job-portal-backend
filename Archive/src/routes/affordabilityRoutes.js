const express = require("express");
const {
    calculateDubaiAffordabilityController,
    calculateDubaiAffordabilityQueryController,
} = require("../controllers/affordabilityController");

const router = express.Router();

router.get("/dubai", calculateDubaiAffordabilityQueryController);
router.post("/dubai", calculateDubaiAffordabilityController);

module.exports = router;
