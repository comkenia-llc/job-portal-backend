const { CompanySubscription, Plan } = require("../models");
const { Op } = require("sequelize");
const { Job } = require("../models"); // optional — only if you need job count checks

/**
 * Universal Feature & Limit Checker
 * @param {string} featureKey - key from plan.features (e.g. "max_jobs", "chat")
 * @param {string|null} limitType - optional usage type (e.g. "max_jobs" for counting)
 */
function checkFeature(featureKey, limitType = null) {
    return async (req, res, next) => {
        try {
            const companyId = req.user.companyId;
            if (!companyId)
                return res.status(403).json({ message: "Company context missing." });

            // Get active subscription
            const subscription = await CompanySubscription.findOne({
                where: {
                    company_id: companyId,
                    status: "active",
                    end_date: {
                        [Op.or]: [{ [Op.gt]: new Date() }, { [Op.is]: null }],
                    },
                },
                include: [{ model: Plan }],
            });

            if (!subscription)
                return res
                    .status(403)
                    .json({ message: "No active plan. Please subscribe or upgrade." });

            const plan = subscription.Plan;
            const features = plan.features || {};

            // If plan doesn't include this feature
            if (!(featureKey in features)) {
                return res.status(403).json({
                    message: `Feature '${featureKey}' not available in your plan.`,
                });
            }

            const featureValue = features[featureKey];

            // Boolean check
            if (typeof featureValue === "boolean" && featureValue === false) {
                return res.status(403).json({
                    message: `This feature (${featureKey}) is disabled in your plan.`,
                });
            }

            // Limit (number) check
            if (typeof featureValue === "number" && limitType) {
                let usageCount = 0;

                if (limitType === "max_jobs") {
                    const { Job } = require("../models");
                    usageCount = await Job.count({ where: { company_id: companyId } });
                }

                if (limitType === "max_messages_day") {
                    const { Message } = require("../models");
                    const startOfDay = new Date();
                    startOfDay.setHours(0, 0, 0, 0);
                    usageCount = await Message.count({
                        where: {
                            company_id: companyId,
                            createdAt: { [Op.gte]: startOfDay },
                        },
                    });
                }

                if (usageCount >= featureValue) {
                    return res.status(403).json({
                        message: `Limit reached for ${featureKey}. Upgrade your plan.`,
                    });
                }
            }

            next();
        } catch (error) {
            console.error("checkFeature error:", error);
            res.status(500).json({ message: "Feature check failed", error: error.message });
        }
    };
}

module.exports = { checkFeature };
