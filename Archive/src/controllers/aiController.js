// Lightweight template-based generator (no external calls)
const templates = require("../data/resumeSummaryTemplates.json");

const clampList = (value, limit = 6) =>
    Array.isArray(value)
        ? value
            .filter(Boolean)
            .map((v) => String(v).trim())
            .filter(Boolean)
            .slice(0, limit)
        : [];

const pickTemplates = ({ role, industry, tone }) => {
    const r = (role || "").toLowerCase();
    const i = (industry || "").toLowerCase();
    const t = (tone || "").toLowerCase();

    // priority: role+industry+tone > role+tone > tone > generic
    const scored = templates
        .map((tpl) => {
            const hasRole = tpl.roles?.some((val) => r.includes(val));
            const hasIndustry = tpl.industries?.some((val) => i.includes(val));
            const toneMatch = t ? tpl.tone === t : true;
            const score = (hasRole ? 2 : 0) + (hasIndustry ? 1 : 0) + (toneMatch ? 1 : 0);
            return { tpl, score };
        })
        .filter(({ score }) => score > 0 || true)
        .sort((a, b) => b.score - a.score);

    return scored.slice(0, 3).map(({ tpl }) => tpl);
};

const renderTemplate = (tpl, payload) => {
    const years = Number(payload.years);
    const data = {
        role: payload.role || "professional",
        industry: payload.industry || "your industry",
        years: Number.isFinite(years) && years > 0 ? years : "several",
        skills:
            clampList(payload.keywords, 4).join(", ") ||
            "strategy, execution, stakeholder communication",
        achievements:
            clampList(payload.achievements, 2).join("; ") ||
            "delivered projects with measurable outcomes",
    };

    return tpl.template.replace(/{{\s*(\w+)\s*}}/g, (_, key) => data[key] || "");
};

exports.generateResumeSummary = async (req, res) => {
    try {
        const {
            role = "professional",
            industry = "your industry",
            years,
            keywords = [],
            achievements = [],
            tone = "concise",
        } = req.body || {};

        const payload = { role, industry, years, keywords, achievements, tone };
        const candidates = pickTemplates(payload);

        const options = (candidates.length ? candidates : templates.slice(0, 3)).map((tpl, idx) => ({
            id: tpl.id || `option-${idx}`,
            text: renderTemplate(tpl, payload),
            tone: tpl.tone,
        }));

        res.json({ options, model: "templates-v1" });
    } catch (err) {
        console.error("❌ AI resume summary error:", err);
        res.status(500).json({ error: "Failed to generate summary" });
    }
};
