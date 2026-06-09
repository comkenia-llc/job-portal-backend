"use strict";

const { CompanySubscription, Plan } = require("../models");
const { Op } = require("sequelize");

const getActiveEmployerSubscription = async (companyId) => {
    if (!companyId) return null;
    const sub = await CompanySubscription.findOne({
        where: {
            company_id: companyId,
            status: "active",
            end_date: { [Op.or]: [{ [Op.gt]: new Date() }, { [Op.is]: null }] },
        },
        include: [{ model: Plan, attributes: ["id", "features"] }],
    });
    return sub || null;
};

const getEmployerPlanFeatures = async (companyId) => {
    const sub = await getActiveEmployerSubscription(companyId);
    if (!sub?.Plan) return null;
    return sub.Plan.features || {};
};

const parseFeatureNumber = (value, fallback = null) => {
    if (value === undefined || value === null || value === "") return fallback;
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
};

const isFeatureEnabled = (value) => value === true || value === "true";

module.exports = {
    getActiveEmployerSubscription,
    getEmployerPlanFeatures,
    parseFeatureNumber,
    isFeatureEnabled,
};
