const { JobAlert, Job, User, Company } = require("../models");
const { Op } = require("sequelize");
const { sendTemplateMail } = require("../services/mailTemplateService");

// ─── CRUD ─────────────────────────────────────────────────────────────────────

exports.getAlerts = async (req, res) => {
    try {
        const alerts = await JobAlert.findAll({
            where: { userId: req.user.id },
            order: [["createdAt", "DESC"]],
        });
        res.json(alerts);
    } catch (err) {
        console.error("❌ getAlerts:", err);
        res.status(500).json({ error: "Failed to fetch alerts" });
    }
};

exports.createAlert = async (req, res) => {
    try {
        const { keywords, location, jobType, category, salaryMin, frequency } = req.body;
        const alert = await JobAlert.create({
            userId: req.user.id,
            keywords,
            location,
            jobType,
            category,
            salaryMin,
            frequency: frequency || "daily",
        });
        res.status(201).json(alert);
    } catch (err) {
        console.error("❌ createAlert:", err);
        res.status(500).json({ error: "Failed to create alert" });
    }
};

exports.updateAlert = async (req, res) => {
    try {
        const alert = await JobAlert.findOne({ where: { id: req.params.id, userId: req.user.id } });
        if (!alert) return res.status(404).json({ error: "Not found" });
        await alert.update(req.body);
        res.json(alert);
    } catch (err) {
        console.error("❌ updateAlert:", err);
        res.status(500).json({ error: "Failed to update alert" });
    }
};

exports.deleteAlert = async (req, res) => {
    try {
        const alert = await JobAlert.findOne({ where: { id: req.params.id, userId: req.user.id } });
        if (!alert) return res.status(404).json({ error: "Not found" });
        await alert.destroy();
        res.json({ message: "Alert deleted" });
    } catch (err) {
        console.error("❌ deleteAlert:", err);
        res.status(500).json({ error: "Failed to delete alert" });
    }
};

// ─── Email dispatch (called by cron) ─────────────────────────────────────────

const buildWhereFromAlert = (alert) => {
    const where = { isActive: true };
    if (alert.keywords) {
        where[Op.or] = [
            { title: { [Op.like]: `%${alert.keywords}%` } },
            { description: { [Op.like]: `%${alert.keywords}%` } },
        ];
    }
    if (alert.location) where.location = { [Op.like]: `%${alert.location}%` };
    if (alert.jobType) where.type = alert.jobType;
    if (alert.salaryMin) where.salaryMax = { [Op.gte]: alert.salaryMin };
    return where;
};

exports.dispatchAlerts = async () => {
    try {
        const now = new Date();
        const dailyCutoff = new Date(now - 24 * 60 * 60 * 1000);
        const weeklyCutoff = new Date(now - 7 * 24 * 60 * 60 * 1000);

        const dueAlerts = await JobAlert.findAll({
            where: {
                isActive: true,
                [Op.or]: [
                    { frequency: "daily", [Op.or]: [{ lastSentAt: null }, { lastSentAt: { [Op.lte]: dailyCutoff } }] },
                    { frequency: "weekly", [Op.or]: [{ lastSentAt: null }, { lastSentAt: { [Op.lte]: weeklyCutoff } }] },
                ],
            },
            include: [{ model: User, attributes: ["email", "firstName"] }],
        });

        console.log(`📧 Processing ${dueAlerts.length} job alerts`);

        for (const alert of dueAlerts) {
            try {
                const sinceDate = alert.lastSentAt || (alert.frequency === "daily" ? dailyCutoff : weeklyCutoff);
                const jobs = await Job.findAll({
                    where: { ...buildWhereFromAlert(alert), createdAt: { [Op.gte]: sinceDate } },
                    limit: 10,
                    order: [["createdAt", "DESC"]],
                    attributes: ["id", "title", "slug", "location", "type", "salaryMin", "salaryMax", "currency", "createdAt"],
                    include: [
                        {
                            model: Company,
                            as: "company",
                            attributes: ["name"],
                            required: false,
                        },
                    ],
                });

                if (jobs.length === 0) continue;

                const siteUrl = process.env.SITE_URL || process.env.FRONTEND_URL || "https://dubaijobzone.com";
                const mappedJobs = jobs.map((job) => ({
                    title: job.title,
                    companyName: job.company?.name || "Company not provided",
                    location: job.location || "Dubai, UAE",
                    type: job.type || "",
                    salaryMin: job.salaryMin,
                    salaryMax: job.salaryMax,
                    currency: job.currency || "AED",
                    postedAt: job.createdAt,
                    url: job.slug ? `${siteUrl}/jobs/${job.slug}` : `${siteUrl}/jobs`,
                }));

                await sendTemplateMail({
                    template: alert.frequency === "weekly" ? "weeklyJobDigest" : "dailyJobAlert",
                    to: alert.User.email,
                    data: {
                        name: alert.User.firstName || "there",
                        alertTitle: alert.keywords
                            ? `Jobs matching "${alert.keywords}"`
                            : "Dubai jobs matching your profile",
                        alertKeyword: alert.keywords || "",
                        alertLocation: alert.location || "Dubai",
                        jobs: mappedJobs,
                        totalMatches: mappedJobs.length,
                        jobsUrl: `${siteUrl}/jobs`,
                        alertSettingsUrl: `${siteUrl}/dashboard/alerts`,
                        weekLabel: "This week",
                        totalNewJobs: mappedJobs.length,
                        recommendedLocation: alert.location || "Dubai",
                        recommendedRole: alert.keywords || "",
                        jobAlertsUrl: `${siteUrl}/dashboard/alerts`,
                        digestSettingsUrl: `${siteUrl}/dashboard/alerts`,
                        companiesUrl: `${siteUrl}/companies`,
                        walkInUrl: `${siteUrl}/walk-in-interviews`,
                        sentAt: now,
                    },
                });

                await alert.update({ lastSentAt: now });
                console.log(`✅ Alert sent to ${alert.User.email} (${jobs.length} jobs)`);
            } catch (mailErr) {
                console.error(`❌ Failed to send alert ${alert.id}:`, mailErr.message);
            }
        }
    } catch (err) {
        console.error("❌ dispatchAlerts error:", err);
    }
};
