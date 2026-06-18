const { CompanySubscription, Plan, Company } = require("../models");
const { Op } = require("sequelize");
const { getCurrencyForMarket } = require("../utils/marketCatalog");

const DEFAULT_EMPLOYER_PLAN_SLUG = "employer-free";

const buildDefaultEmployerPlan = (market = "global") => ({
    name: "Employer Free",
    slug: DEFAULT_EMPLOYER_PLAN_SLUG,
    market,
    audience: "employer",
    price_monthly: 0,
    price_yearly: 0,
    currency: getCurrencyForMarket(market),
    duration_type: "monthly",
    description: "Free starter plan for new employers.",
    features: {
        can_post_jobs: true,
        max_jobs: 1,
        can_message_candidates: true,
        max_messages_day: 10,
        can_view_candidates: true,
        can_view_resumes: true,
        can_download_resumes: false,
        can_access_analytics: true,
        can_feature_jobs: false,
        featured_jobs_limit: 0,
    },
    ribbon_text: "Free",
    ribbon_color: "#0f172a",
    ribbon_text_color: "#ffffff",
    is_active: true,
});

const ensureDefaultEmployerPlan = async (market = "global") => {
    const defaults = buildDefaultEmployerPlan(market);
    const [plan] = await Plan.findOrCreate({
        where: { slug: DEFAULT_EMPLOYER_PLAN_SLUG, market },
        defaults,
    });

    await plan.update(defaults);

    return plan;
};

const assignDefaultEmployerPlan = async (companyId) => {
    if (!companyId) return null;

    const activeSubscription = await CompanySubscription.findOne({
        where: {
            company_id: companyId,
            status: "active",
            end_date: {
                [Op.or]: [{ [Op.gt]: new Date() }, { [Op.is]: null }],
            },
        },
    });

    if (activeSubscription) {
        return activeSubscription;
    }

    const company = await Company.findByPk(companyId, {
        attributes: ["id", "market"],
    });
    const plan = await ensureDefaultEmployerPlan(company?.market || "global");

    return CompanySubscription.create({
        company_id: companyId,
        plan_id: plan.id,
        start_date: new Date(),
        end_date: null,
        renewal_method: "manual",
        status: "active",
        notes: "Auto-assigned free employer starter plan",
    });
};

module.exports = {
    DEFAULT_EMPLOYER_PLAN_SLUG,
    ensureDefaultEmployerPlan,
    assignDefaultEmployerPlan,
};
