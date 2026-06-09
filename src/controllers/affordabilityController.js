const {
    calculateDubaiAffordability,
} = require("../services/affordabilityService");

exports.calculateDubaiAffordabilityController = async (req, res) => {
    try {
        const {
            salary,
            profileKey = "advanced",
            overrides = {},
            familySize = 1,
            neighborhoodTier = "mid",
            neighborhoodRentMultiplier = null,
            housingType = "studio",
            transportMode = "public",
        } = req.body;

        if (!salary || Number(salary) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid salary is required.",
            });
        }

        const result = calculateDubaiAffordability({
            salary: Number(salary),
            profileKey,
            overrides,
            familySize,
            neighborhoodTier,
            neighborhoodRentMultiplier,
            housingType,
            transportMode,
        });

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error("Affordability calculation error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
};

exports.calculateDubaiAffordabilityQueryController = async (req, res) => {
    try {
        const { salary, profileKey = "single_budget" } = req.query;

        if (!salary || Number(salary) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid salary is required.",
            });
        }

        const result = calculateDubaiAffordability({
            salary: Number(salary),
            profileKey,
        });

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error("Affordability calculation error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error",
        });
    }
};
