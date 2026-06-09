const { JobAlert, Job, User } = require("../models");
const { Op } = require("sequelize");
const nodemailer = require("nodemailer");

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

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

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
                    attributes: ["id", "title", "slug", "location", "type", "salaryMin", "salaryMax"],
                });

                if (jobs.length === 0) continue;

                const frontendUrl = process.env.FRONTEND_URL || "https://jobs.keekan.com";
                const jobRows = jobs.map((j) =>
                    `<tr>
                        <td style="padding:8px 0;border-bottom:1px solid #f0f0f0">
                            <a href="${frontendUrl}/jobs/${j.slug}" style="color:#2563eb;font-weight:600;text-decoration:none">${j.title}</a>
                            <br><span style="color:#6b7280;font-size:13px">${j.location || "Dubai, UAE"} · ${j.type || ""}</span>
                        </td>
                    </tr>`
                ).join("");

                await transporter.sendMail({
                    from: `"Keekan Jobs" <${process.env.SMTP_USER}>`,
                    to: alert.User.email,
                    subject: `${jobs.length} new job${jobs.length > 1 ? "s" : ""} matching "${alert.keywords || "your alert"}"`,
                    html: `
                        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
                            <div style="background:#2563eb;padding:20px 24px;border-radius:8px 8px 0 0">
                                <h1 style="color:#fff;margin:0;font-size:20px">New Jobs For You</h1>
                            </div>
                            <div style="padding:20px 24px;background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
                                <p style="color:#374151">Hi ${alert.User.firstName || "there"},</p>
                                <p style="color:#374151">Here are the latest jobs matching <strong>${alert.keywords || "your search"}</strong>:</p>
                                <table style="width:100%;border-collapse:collapse">${jobRows}</table>
                                <div style="margin-top:20px">
                                    <a href="${frontendUrl}/jobs" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">Browse All Jobs</a>
                                </div>
                                <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb">
                                <p style="color:#9ca3af;font-size:12px">
                                    You're receiving this because you set up a job alert on Keekan Jobs.<br>
                                    <a href="${frontendUrl}/dashboard/alerts" style="color:#6b7280">Manage alerts</a>
                                </p>
                            </div>
                        </div>`,
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
