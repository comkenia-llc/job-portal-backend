const { Sequelize } = require("sequelize");
const {
    Job,
    Application,
    Resume,
    User,
    Interview,
    Company
} = require("../models");
const { sendMail } = require("../utils/mailer");
const { applyMarketScope } = require("../utils/market");
const { assertEmployerMarketAccess } = require("../utils/marketAccess");

const isNumeric = (val) => /^\d+$/.test(String(val ?? "").trim());

const findJobForCompany = async (identifier, companyId) => {
    const where = isNumeric(identifier) ? { id: Number(identifier) } : { slug: identifier };
    if (companyId) where.companyId = companyId;
    return Job.findOne({ where });
};

const mapCounts = (rows, key) =>
    rows.reduce((acc, row) => {
        const k = row[key];
        acc[k] = acc[k] || {};
        acc[k][row.status || "all"] = parseInt(row.count, 10);
        return acc;
    }, {});

// ====================================================
// 🧳 List employer jobs with applicant/interview counts
// ====================================================
exports.getEmployerJobs = async (req, res) => {
    try {
        const access = await assertEmployerMarketAccess(req);
        if (!access.ok) {
            return res.status(access.status).json({ error: access.error });
        }
        const companyId = req.companyId || req.query.companyId || req.user.companyId;
        if (!companyId) return res.status(400).json({ error: "Company not found for employer" });

        const jobs = await Job.findAll({
            where: applyMarketScope({ companyId }, req, {
                allowAdminOverride: true,
                allowAllForAdmin: false,
            }),
            order: [["updatedAt", "DESC"]],
        });

        const jobIds = jobs.map((j) => j.id);

        const applicationCounts = jobIds.length
            ? await Application.findAll({
                attributes: [
                    "jobId",
                    "status",
                    [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
                ],
                where: { jobId: jobIds },
                group: ["jobId", "status"],
                raw: true,
            })
            : [];

        const interviewCounts = jobIds.length
            ? await Interview.findAll({
                attributes: ["jobId", [Sequelize.fn("COUNT", Sequelize.col("id")), "count"]],
                where: { jobId: jobIds },
                group: ["jobId"],
                raw: true,
            })
            : [];

        const appMap = mapCounts(applicationCounts, "jobId");
        const interviewMap = Object.fromEntries(
            interviewCounts.map((r) => [r.jobId, parseInt(r.count, 10)])
        );

        const payload = jobs.map((job) => ({
            ...job.toJSON(),
            applicantCounts: appMap[job.id] || {},
            interviewCount: interviewMap[job.id] || 0,
        }));

        res.json(payload);
    } catch (err) {
        console.error("❌ [EMPLOYER] getEmployerJobs error:", err);
        res.status(500).json({ error: "Failed to load employer jobs" });
    }
};

// ====================================================
// 📄 List applications for a specific job
// ====================================================
exports.getJobApplications = async (req, res) => {
    try {
        const access = await assertEmployerMarketAccess(req);
        if (!access.ok) {
            return res.status(access.status).json({ error: access.error });
        }
        const companyId = req.companyId || req.user.companyId;
        const { identifier } = req.params;

        const job = await findJobForCompany(identifier, req.user.role === "admin" ? null : companyId);
        if (!job) return res.status(404).json({ error: "Job not found" });
        if (req.user.role !== "admin" && job.companyId !== companyId) {
            return res.status(403).json({ error: "Not allowed to view this job" });
        }

        const applications = await Application.findAll({
            where: { jobId: job.id },
            include: [
                {
                    model: User,
                    as: "candidate",
                    attributes: ["id", "username", "email", "firstName", "lastName"],
                },
                {
                    model: Resume,
                    as: "resume",
                    attributes: ["id", "title", "isPublic", "createdAt", "updatedAt"],
                },
                {
                    model: Interview,
                    as: "interviews",
                    attributes: [
                        "id",
                        "scheduledFor",
                        "status",
                        "type",
                        "meetingLink",
                        "location",
                        "interviewerName",
                        "createdAt",
                    ],
                    separate: true,
                    order: [["scheduledFor", "DESC"]],
                },
            ],
            order: [["appliedAt", "DESC"]],
        });

        res.json({ job, applications });
    } catch (err) {
        console.error("❌ [EMPLOYER] getJobApplications error:", err);
        res.status(500).json({ error: "Failed to load applications" });
    }
};

const allowedApplicationStatuses = (Application.rawAttributes?.status?.values) || [
    "pending",
    "reviewed",
    "interview",
    "offered",
    "hired",
    "rejected",
];

// ====================================================
// 🏷️ Update application status (with optional note)
// ====================================================
exports.updateApplicationStatus = async (req, res) => {
    try {
        const access = await assertEmployerMarketAccess(req);
        if (!access.ok) {
            return res.status(access.status).json({ error: access.error });
        }
        const companyId = req.companyId || req.user.companyId;
        const { id } = req.params;
        const { status, note } = req.body;

        if (!allowedApplicationStatuses.includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        const application = await Application.findByPk(id, {
            include: [
                { model: Job, as: "job", attributes: ["id", "title", "companyId", "slug"] },
                { model: User, as: "candidate", attributes: ["id", "email", "firstName", "lastName"] },
            ],
        });

        if (!application) return res.status(404).json({ error: "Application not found" });
        if (req.user.role !== "admin" && application.job.companyId !== companyId) {
            return res.status(403).json({ error: "Not allowed to update this application" });
        }

        application.status = status;
        application.stageUpdatedAt = new Date();
        if (note) application.notes = note;

        const history = Array.isArray(application.statusHistory) ? application.statusHistory : [];
        history.push({
            status,
            note: note || null,
            at: new Date(),
            byUserId: req.user.id,
        });
        application.statusHistory = history;

        await application.save();

        // Optional email notification to candidate
        if (application.candidate?.email) {
            const candidateName =
                application.candidate.firstName || application.candidate.lastName
                    ? `${application.candidate.firstName || ""} ${application.candidate.lastName || ""}`.trim()
                    : application.candidate.email;
            sendMail({
                to: application.candidate.email,
                subject: `Your application status changed to ${status}`,
                text: `Hi ${candidateName},\n\nYour application for "${application.job.title}" was updated to "${status}".\n\n${note ? `Note: ${note}\n\n` : ""}Thank you,\n${process.env.SMTP_FROM || "Keekan Jobs"}`,
            }).catch((err) => console.warn("⚠️ [MAILER] Status email failed:", err.message));
        }

        res.json(application);
    } catch (err) {
        console.error("❌ [EMPLOYER] updateApplicationStatus error:", err);
        res.status(500).json({ error: "Failed to update application status" });
    }
};

// ====================================================
// 🗒️ Update employer notes on application
// ====================================================
exports.updateApplicationNote = async (req, res) => {
    try {
        const access = await assertEmployerMarketAccess(req);
        if (!access.ok) {
            return res.status(access.status).json({ error: access.error });
        }
        const companyId = req.companyId || req.user.companyId;
        const { id } = req.params;
        const { note } = req.body;

        const application = await Application.findByPk(id, {
            include: [{ model: Job, as: "job", attributes: ["id", "companyId"] }],
        });

        if (!application) return res.status(404).json({ error: "Application not found" });
        if (req.user.role !== "admin" && application.job.companyId !== companyId) {
            return res.status(403).json({ error: "Not allowed to update this application" });
        }

        application.notes = note || null;
        await application.save();

        res.json(application);
    } catch (err) {
        console.error("❌ [EMPLOYER] updateApplicationNote error:", err);
        res.status(500).json({ error: "Failed to update note" });
    }
};

// ====================================================
// 📅 Schedule interview
// ====================================================
exports.scheduleInterview = async (req, res) => {
    try {
        const access = await assertEmployerMarketAccess(req);
        if (!access.ok) {
            return res.status(access.status).json({ error: access.error });
        }
        const companyId = req.companyId || req.user.companyId;
        const { id } = req.params;
        const {
            scheduledFor,
            type,
            location,
            meetingLink,
            interviewerName,
            timezone,
            notes,
        } = req.body;

        if (!scheduledFor) {
            return res.status(400).json({ error: "scheduledFor is required" });
        }

        const application = await Application.findByPk(id, {
            include: [
                { model: Job, as: "job", attributes: ["id", "title", "companyId"] },
                { model: User, as: "candidate", attributes: ["id", "email", "firstName", "lastName"] },
            ],
        });

        if (!application) return res.status(404).json({ error: "Application not found" });
        if (req.user.role !== "admin" && application.job.companyId !== companyId) {
            return res.status(403).json({ error: "Not allowed to schedule for this application" });
        }

        const interview = await Interview.create({
            applicationId: application.id,
            jobId: application.jobId,
            candidateId: application.userId,
            createdBy: req.user.id,
            scheduledFor,
            status: "scheduled",
            type: type || null,
            location: location || null,
            meetingLink: meetingLink || null,
            interviewerName: interviewerName || null,
            timezone: timezone || null,
            notes: notes || null,
        });

        // Auto-mark application stage to interview
        application.status = "interview";
        application.stageUpdatedAt = new Date();
        const history = Array.isArray(application.statusHistory) ? application.statusHistory : [];
        history.push({
            status: "interview",
            note: "Interview scheduled",
            at: new Date(),
            byUserId: req.user.id,
        });
        application.statusHistory = history;
        await application.save();

        if (application.candidate?.email) {
            const candidateName =
                application.candidate.firstName || application.candidate.lastName
                    ? `${application.candidate.firstName || ""} ${application.candidate.lastName || ""}`.trim()
                    : application.candidate.email;

            const details = [
                `Role: ${application.job.title}`,
                `When: ${new Date(scheduledFor).toLocaleString()}`,
                type ? `Type: ${type}` : null,
                meetingLink ? `Meeting link: ${meetingLink}` : null,
                location ? `Location: ${location}` : null,
                interviewerName ? `Interviewer: ${interviewerName}` : null,
                timezone ? `Timezone: ${timezone}` : null,
                notes ? `Notes: ${notes}` : null,
            ]
                .filter(Boolean)
                .join("\n");

            sendMail({
                to: application.candidate.email,
                subject: `Interview scheduled for ${application.job.title}`,
                text: `Hi ${candidateName},\n\nYou've been invited to an interview.\n\n${details}\n\nThank you,\n${process.env.SMTP_FROM || "Keekan Jobs"}`,
            }).catch((err) => console.warn("⚠️ [MAILER] Interview email failed:", err.message));
        }

        res.status(201).json(interview);
    } catch (err) {
        console.error("❌ [EMPLOYER] scheduleInterview error:", err);
        res.status(500).json({ error: "Failed to schedule interview" });
    }
};

// ====================================================
// 🗓️ List interviews for employer
// ====================================================
exports.listInterviews = async (req, res) => {
    try {
        const access = await assertEmployerMarketAccess(req);
        if (!access.ok) {
            return res.status(access.status).json({ error: access.error });
        }
        const companyId = req.companyId || req.user.companyId;
        const jobFilter = req.query.jobId;

        const where = {};
        if (jobFilter) where.jobId = jobFilter;
        if (req.query.status) where.status = req.query.status;

        const interviews = await Interview.findAll({
            where,
            include: [
                {
                    model: Job,
                    as: "job",
                    attributes: ["id", "title", "slug", "companyId"],
                    where: req.user.role === "admin" ? undefined : { companyId },
                },
                {
                    model: User,
                    as: "candidate",
                    attributes: ["id", "email", "firstName", "lastName"],
                },
                {
                    model: Application,
                    as: "application",
                    attributes: ["id", "status"],
                },
            ],
            order: [["scheduledFor", "DESC"]],
        });

        res.json(interviews);
    } catch (err) {
        console.error("❌ [EMPLOYER] listInterviews error:", err);
        res.status(500).json({ error: "Failed to load interviews" });
    }
};

exports.getEmployerBySlug = async (req, res) => {
    try {
        const company = await Company.findOne({
            where: { slug: req.params.slug },
        });

        if (!company) {
            return res.status(404).json({ error: "Company not found" });
        }

        res.json(company);
    } catch (err) {
        console.error("❌ getEmployerBySlug error:", err);
        res.status(500).json({ error: "Failed to fetch company" });
    }
};