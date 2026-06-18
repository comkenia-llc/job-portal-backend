const { Application, Job, Resume, Company } = require("../models");
const { User } = require("../models");
const { Op } = require("sequelize");
const {
    sendTemplateMail,
    getSiteUrl,
    getCandidateApplicationsUrl,
    getEmployerApplicantsUrl,
} = require("../services/mailTemplateService");

const formatSalaryText = (job) => {
    if (!job?.salaryMin && !job?.salaryMax) {
        return "";
    }

    const currency = job.currency || "AED";

    if (job.salaryMin && job.salaryMax) {
        return `${currency} ${job.salaryMin} - ${job.salaryMax}`;
    }

    return `${currency} ${job.salaryMin || job.salaryMax}`;
};

const shouldSendEmployerNotification = (company, key) => {
    const prefs = company?.notificationPreferences;
    if (!prefs || typeof prefs !== "object") {
        return true;
    }

    return prefs[key] !== false;
};

const findResumeForUser = async (userId, preferredId) => {
    if (preferredId) {
        const preferred = await Resume.findOne({ where: { id: preferredId, userId } });
        if (preferred) return preferred;
    }

    let resume = await Resume.findOne({ where: { userId, isDefault: true } });
    if (!resume) {
        resume = await Resume.findOne({
            where: { userId },
            order: [["updatedAt", "DESC"]],
        });
    }

    return resume;
};

exports.applyToJob = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { jobId, resumeId, coverLetter } = req.body;

        if (!userId) {
            return res.status(401).json({ error: "Authentication required" });
        }
        if (!jobId) {
            return res.status(400).json({ error: "Missing jobId" });
        }

        const job = await Job.findByPk(jobId, {
            include: [
                {
                    model: Company,
                    as: "company",
                    attributes: ["id", "name", "slug", "email", "notificationPreferences"],
                },
                {
                    model: User,
                    as: "poster",
                    attributes: ["id", "email", "firstName", "lastName", "username"],
                    required: false,
                },
            ],
        });
        if (!job) {
            return res.status(404).json({ error: "Job not found" });
        }

        const existing = await Application.findOne({ where: { userId, jobId } });
        if (existing) {
            return res.status(409).json({ error: "You already applied to this role" });
        }

        const resume = await findResumeForUser(userId, resumeId);
        if (!resume) {
            return res.status(400).json({ error: "Create a resume before applying" });
        }

        const application = await Application.create({
            userId,
            jobId,
            resumeId: resume.id,
            coverLetter: coverLetter?.trim() || null,
            status: "pending",
            appliedAt: new Date(),
        });

        const candidate = await User.findByPk(userId, {
            attributes: ["id", "email", "firstName", "lastName", "username", "phone", "location", "about"],
        });

        const siteUrl = getSiteUrl();
        const jobUrl = job.slug ? `${siteUrl}/jobs/${job.slug}` : `${siteUrl}/jobs`;
        const companyUrl = job.company?.slug
            ? `${siteUrl}/companies/${job.company.slug}`
            : `${siteUrl}/companies`;
        const applicationUrl = getCandidateApplicationsUrl();
        const employerApplicationUrl = getEmployerApplicantsUrl();

        if (candidate?.email) {
            sendTemplateMail({
                template: "candidateApplicationSubmitted",
                to: candidate.email,
                data: {
                    candidateName:
                        `${candidate.firstName || ""} ${candidate.lastName || ""}`.trim() ||
                        candidate.username ||
                        "there",
                    jobTitle: job.title,
                    companyName: job.company?.name || "",
                    location: job.location || "",
                    jobType: job.type || "",
                    salaryText: formatSalaryText(job),
                    applicationStatus: "Submitted",
                    applicationUrl,
                    jobUrl,
                    companyUrl,
                    submittedAt: application.appliedAt,
                },
            }).catch((mailErr) =>
                console.warn("⚠️ [MAILER] Candidate application email failed:", mailErr.message)
            );
        }

        const employerRecipient = job.poster?.email || job.company?.email;
        if (employerRecipient && shouldSendEmployerNotification(job.company, "newApplications")) {
            sendTemplateMail({
                template: "employerNewApplication",
                to: employerRecipient,
                data: {
                    employerName:
                        `${job.poster?.firstName || ""} ${job.poster?.lastName || ""}`.trim() ||
                        job.poster?.username ||
                        job.company?.name ||
                        "there",
                    companyName: job.company?.name || "",
                    candidateName:
                        `${candidate?.firstName || ""} ${candidate?.lastName || ""}`.trim() ||
                        candidate?.username ||
                        "Candidate",
                    candidateEmail: candidate?.email || "",
                    candidatePhone: candidate?.phone || "",
                    jobTitle: job.title,
                    location: job.location || "",
                    applicationStatus: "New",
                    appliedAt: application.appliedAt,
                    candidateSummary: candidate?.about || "",
                    currentLocation: candidate?.location || "",
                    applicationUrl: employerApplicationUrl,
                    jobUrl,
                },
            }).catch((mailErr) =>
                console.warn("⚠️ [MAILER] Employer application email failed:", mailErr.message)
            );
        }

        res.status(201).json(application);
    } catch (err) {
        console.error("❌ applyToJob error:", err);
        res.status(500).json({ error: "Failed to submit application" });
    }
};

exports.listUserApplications = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Authentication required" });

        const where = { userId };
        if (req.query.jobId) where.jobId = req.query.jobId;

        const applications = await Application.findAll({
            where,
            include: [
                {
                    model: Job,
                    as: "job",
                    include: [
                        {
                            model: Company,
                            as: "company",
                            attributes: ["id", "name", "logoUrl", "industry"],
                        },
                    ],
                },
                {
                    model: Resume,
                    as: "resume",
                    attributes: ["id", "title", "isPublic"],
                },
            ],
            order: [["appliedAt", "DESC"]],
        });

        res.json(applications);
    } catch (err) {
        console.error("❌ listUserApplications error:", err);
        res.status(500).json({ error: "Failed to load applications" });
    }
};

// ✅ Get single application for current user by job
exports.getApplicationByJob = async (req, res) => {
    try {
        const userId = req.user?.id;
        const jobId = req.params.jobId;
        if (!userId) return res.status(401).json({ error: "Authentication required" });
        if (!jobId) return res.status(400).json({ error: "Missing jobId" });

        const application = await Application.findOne({
            where: { userId, jobId },
            include: [
                {
                    model: Job,
                    as: "job",
                    attributes: ["id", "title", "slug", "location", "type"],
                    include: [
                        { model: Company, as: "company", attributes: ["id", "name", "logoUrl", "industry"] },
                    ],
                },
                {
                    model: Resume,
                    as: "resume",
                    attributes: ["id", "title", "isPublic"],
                },
            ],
        });

        if (!application) return res.json(null);

        res.json(application);
    } catch (err) {
        console.error("❌ getApplicationByJob error:", err);
        res.status(500).json({ error: "Failed to load application" });
    }
};

exports.withdrawApplication = async (req, res) => {
    try {
        const userId = req.user?.id;
        const application = await Application.findByPk(req.params.id);
        if (!application || application.userId !== userId) {
            return res.status(404).json({ error: "Application not found" });
        }

        application.isWithdrawn = true;
        application.stageUpdatedAt = new Date();
        application.status = "rejected";
        await application.save();

        res.json({ message: "Application withdrawn" });
    } catch (err) {
        console.error("❌ withdrawApplication error:", err);
        res.status(500).json({ error: "Failed to withdraw application" });
    }
};

// ================================================
// 🛡️ Admin: list all applications (with filters)
// ================================================
exports.listAllApplicationsAdmin = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, search = "" } = req.query;
        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
        const offset = (pageNum - 1) * limitNum;

        const where = {};
        if (status) where.status = status;

        const include = [
            {
                model: Job,
                as: "job",
                attributes: ["id", "title", "slug", "location", "type"],
                include: [{ model: Company, as: "company", attributes: ["id", "name", "logoUrl"] }],
            },
            { model: User, as: "candidate", attributes: ["id", "username", "email", "firstName", "lastName"] },
            { model: Resume, as: "resume", attributes: ["id", "title", "isPublic"] },
        ];

        if (search.trim()) {
            const term = `%${search.trim()}%`;
            where[Op.or] = [
                { "$job.title$": { [Op.like]: term } },
                { "$candidate.email$": { [Op.like]: term } },
                { "$candidate.username$": { [Op.like]: term } },
            ];
        }

        const { rows, count } = await Application.findAndCountAll({
            where,
            include,
            order: [["appliedAt", "DESC"]],
            limit: limitNum,
            offset,
            distinct: true,
        });

        res.json({
            applications: rows,
            total: count,
            page: pageNum,
            totalPages: Math.max(1, Math.ceil(count / limitNum)),
        });
    } catch (err) {
        console.error("❌ Admin list applications error:", err);
        res.status(500).json({ error: "Failed to load applications" });
    }
};
