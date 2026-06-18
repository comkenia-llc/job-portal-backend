const PROFILE_COMPLETION_THRESHOLD = 85;

const PROFILE_STRENGTH_RULES = [
    { key: "name", label: "Company name", weight: 10 },
    { key: "industry", label: "Industry", weight: 10 },
    { key: "companyCategoryId", label: "Company category", weight: 5 },
    { key: "size", label: "Company size", weight: 5 },
    { key: "tagline", label: "Short headline", weight: 5 },
    { key: "about", label: "Company description", weight: 15 },
    { key: "website", label: "Website", weight: 5 },
    { key: "email", label: "Company email", weight: 5 },
    { key: "phone", label: "Phone number", weight: 5 },
    { key: "foundedYear", label: "Founded year", weight: 5 },
    { key: "locationId", label: "Primary location", weight: 10 },
    { key: "logoUrl", label: "Company logo", weight: 15 },
    { key: "bannerUrl", label: "Banner image", weight: 10 },
];

const hasValue = (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (typeof value === "number") return Number.isFinite(value) && value > 0;
    return Boolean(value);
};

const buildCompanyProfileStrength = (company = {}) => {
    const items = PROFILE_STRENGTH_RULES.map((rule) => {
        const complete = hasValue(company?.[rule.key]);
        return {
            key: rule.key,
            label: rule.label,
            weight: rule.weight,
            complete,
        };
    });

    const score = items.reduce((sum, item) => sum + (item.complete ? item.weight : 0), 0);
    const missing = items.filter((item) => !item.complete).map((item) => item.label);

    return {
        score,
        threshold: PROFILE_COMPLETION_THRESHOLD,
        readyToPostJobs: score >= PROFILE_COMPLETION_THRESHOLD,
        missing,
        items,
    };
};

module.exports = {
    PROFILE_COMPLETION_THRESHOLD,
    PROFILE_STRENGTH_RULES,
    buildCompanyProfileStrength,
};
