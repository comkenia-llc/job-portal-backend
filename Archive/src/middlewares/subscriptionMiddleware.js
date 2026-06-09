'use strict';
const { CompanySubscription, Plan } = require("../models");
const { Op } = require("sequelize");

/**
 * Ensures employer has an active subscription for their company.
 * Admins bypass this check.
 */
exports.requireActiveSubscription = async (req, res, next) => {
    try {
        if (req.user?.role === "admin") return next();

        const companyId = req.user?.companyId;
        if (!companyId) {
            return res.status(403).json({ error: "No company linked to employer account" });
        }

        const subscription = await CompanySubscription.findOne({
            where: {
                company_id: companyId,
                status: "active",
                end_date: {
                    [Op.or]: [{ [Op.gt]: new Date() }, { [Op.is]: null }],
                },
            },
            include: [{ model: Plan, attributes: ["id", "name", "slug"] }],
            order: [["start_date", "DESC"]],
        });

        if (!subscription) {
            return res.status(402).json({
                error: "Active subscription required",
                companyId,
            });
        }

        req.companyId = companyId;
        req.companySubscription = subscription;
        next();
    } catch (err) {
        console.error("❌ [SUBSCRIPTION] Error:", err);
        res.status(500).json({ error: "Failed to verify subscription" });
    }
};
