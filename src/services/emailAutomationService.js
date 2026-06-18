const { Op } = require("sequelize");
const { Job, User, Company, Application, SavedJob, WalkInInterview, JobAlert, Location } = require("../models");
const {
    sendTemplateMail,
    getSiteUrl,
    getCandidateAlertsUrl,
    getCandidateSavedJobsUrl,
    getEmployerDashboardUrl,
    getEmployerApplicantsUrl,
    getPostJobUrl,
} = require("./mailTemplateService");

const formatSalaryText = ({ salaryMin, salaryMax, currency = "AED" }) => {
    if (!salaryMin && !salaryMax) return "";
    if (salaryMin && salaryMax) return `${currency} ${salaryMin} - ${salaryMax}`;
    return `${currency} ${salaryMin || salaryMax}`;
};

const getUserName = (user) =>
    user?.firstName ||
    user?.username ||
    user?.email?.split("@")[0] ||
    "there";

const dispatchJobLifecycleEmails = async () => {
    const now = new Date();
    const soonThreshold = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const siteUrl = getSiteUrl();

    const jobs = await Job.findAll({
        where: {
            [Op.or]: [
                {
                    status: "open",
                    deadline: { [Op.gt]: now, [Op.lte]: soonThreshold },
                    expiringSoonEmailSentAt: null,
                },
                {
                    status: "open",
                    deadline: { [Op.lte]: now },
                    expiredEmailSentAt: null,
                },
            ],
        },
        include: [
            { model: Company, as: "company", attributes: ["id", "name"] },
            { model: User, as: "poster", attributes: ["id", "email", "firstName", "username"] },
        ],
    });

    for (const job of jobs) {
        if (!job.poster?.email) continue;
        const applicationCount = await Application.count({ where: { jobId: job.id } });
        const commonData = {
            employerName: getUserName(job.poster),
            companyName: job.company?.name || "",
            jobTitle: job.title,
            location: job.location || "",
            jobType: job.type || "",
            salaryText: formatSalaryText(job),
            totalViews: job.views || 0,
            totalApplications: applicationCount,
            renewJobUrl: getEmployerDashboardUrl(),
            dashboardJobUrl: getEmployerDashboardUrl(),
            applicationsUrl: getEmployerApplicantsUrl(),
            jobUrl: job.slug ? `${siteUrl}/jobs/${job.slug}` : `${siteUrl}/jobs`,
            postNewJobUrl: getPostJobUrl(),
        };

        if (job.deadline > now && job.deadline <= soonThreshold && !job.expiringSoonEmailSentAt) {
            await sendTemplateMail({
                template: "jobExpiringSoon",
                to: job.poster.email,
                data: {
                    ...commonData,
                    expiresAt: job.deadline,
                    daysRemaining: Math.max(1, Math.ceil((job.deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))),
                },
            }).catch((mailErr) =>
                console.warn("⚠️ [MAILER] Job expiring soon email failed:", mailErr.message)
            );
            job.expiringSoonEmailSentAt = now;
            await job.save();
        }

        if (job.deadline <= now && !job.expiredEmailSentAt) {
            await sendTemplateMail({
                template: "jobExpired",
                to: job.poster.email,
                data: {
                    ...commonData,
                    expiredAt: now,
                    deadline: job.deadline,
                },
            }).catch((mailErr) =>
                console.warn("⚠️ [MAILER] Job expired email failed:", mailErr.message)
            );
            job.expiredEmailSentAt = now;
            await job.save();
        }
    }
};

const dispatchSavedJobReminders = async () => {
    const siteUrl = getSiteUrl();
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const savedJobs = await SavedJob.findAll({
        where: {
            reminderSentAt: null,
            createdAt: { [Op.lte]: cutoff },
        },
        include: [
            { model: User, as: "user", attributes: ["id", "email", "firstName", "username"] },
            {
                model: Job,
                as: "job",
                attributes: ["id", "title", "slug", "location", "type", "salaryMin", "salaryMax", "currency", "deadline", "status"],
                include: [{ model: Company, as: "company", attributes: ["name"] }],
            },
        ],
    });

    const grouped = new Map();
    for (const saved of savedJobs) {
        if (!saved.user?.email || !saved.job || saved.job.status !== "open") continue;
        const key = saved.user.id;
        if (!grouped.has(key)) {
            grouped.set(key, { user: saved.user, items: [] });
        }
        grouped.get(key).items.push(saved);
    }

    for (const { user, items } of grouped.values()) {
        const jobs = items.map((saved) => ({
            title: saved.job.title,
            companyName: saved.job.company?.name || "",
            location: saved.job.location || "",
            jobType: saved.job.type || "",
            salaryMin: saved.job.salaryMin,
            salaryMax: saved.job.salaryMax,
            currency: saved.job.currency || "AED",
            deadline: saved.job.deadline,
            savedAt: saved.createdAt,
            url: saved.job.slug ? `${siteUrl}/jobs/${saved.job.slug}` : `${siteUrl}/jobs`,
        }));

        await sendTemplateMail({
            template: "savedJobReminder",
            to: user.email,
            data: {
                name: getUserName(user),
                jobs,
                totalSavedJobs: jobs.length,
                savedJobsUrl: getCandidateSavedJobsUrl(),
                jobsUrl: `${siteUrl}/jobs`,
                jobAlertsUrl: getCandidateAlertsUrl(),
                sentAt: new Date(),
            },
        }).catch((mailErr) =>
            console.warn("⚠️ [MAILER] Saved job reminder email failed:", mailErr.message)
        );

        await SavedJob.update(
            { reminderSentAt: new Date() },
            { where: { id: items.map((item) => item.id) } }
        );
    }
};

const dispatchWalkInInterviewAlerts = async () => {
    const now = new Date();
    const dailyCutoff = new Date(now - 24 * 60 * 60 * 1000);
    const weeklyCutoff = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const siteUrl = getSiteUrl();

    const dueAlerts = await JobAlert.findAll({
        where: {
            isActive: true,
            [Op.or]: [
                { frequency: "daily", [Op.or]: [{ lastSentAt: null }, { lastSentAt: { [Op.lte]: dailyCutoff } }] },
                { frequency: "weekly", [Op.or]: [{ lastSentAt: null }, { lastSentAt: { [Op.lte]: weeklyCutoff } }] },
            ],
        },
        include: [{ model: User, attributes: ["email", "firstName", "username"] }],
    });

    for (const alert of dueAlerts) {
        const sinceDate = alert.lastSentAt || (alert.frequency === "daily" ? dailyCutoff : weeklyCutoff);
        const where = {
            status: "open",
            createdAt: { [Op.gte]: sinceDate },
        };
        if (alert.keywords) {
            where[Op.or] = [{ title: { [Op.like]: `%${alert.keywords}%` } }];
        }

        const interviews = await WalkInInterview.findAll({
            where,
            include: [
                { model: Company, as: "company", attributes: ["name"] },
                { model: Location, as: "location", attributes: ["name", "city", "state", "country"] },
            ],
            limit: 8,
            order: [["createdAt", "DESC"]],
        });

        const filtered = interviews.filter((item) => {
            if (!alert.location) return true;
            const haystack = [item.location?.name, item.location?.city, item.location?.state, item.location?.country]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
            return haystack.includes(String(alert.location).toLowerCase());
        });

        if (!filtered.length || !alert.User?.email) continue;

        await sendTemplateMail({
            template: "walkInInterviewAlert",
            to: alert.User.email,
            data: {
                name: getUserName(alert.User),
                alertTitle: alert.keywords ? `Walk-in interviews for "${alert.keywords}"` : "Walk-in interviews near you",
                alertLocation: alert.location || "Dubai",
                alertRole: alert.keywords || "",
                interviews: filtered.map((item) => ({
                    title: item.title,
                    companyName: item.company?.name || "",
                    location: item.location?.name || item.location?.city || "",
                    venue: item.venueDetails || "",
                    interviewDate: item.interviewStartDate,
                    interviewTime: item.interviewTime || "",
                    url: item.slug ? `${siteUrl}/walk-in-interview/${item.slug}` : `${siteUrl}/walk-in-interviews`,
                })),
                totalMatches: filtered.length,
                walkInUrl: `${siteUrl}/walk-in-interviews`,
                jobsUrl: `${siteUrl}/jobs`,
                alertSettingsUrl: getCandidateAlertsUrl(),
                unsubscribeUrl: getCandidateAlertsUrl(),
                sentAt: now,
            },
        }).catch((mailErr) =>
            console.warn("⚠️ [MAILER] Walk-in interview alert email failed:", mailErr.message)
        );

        await alert.update({ lastSentAt: now });
    }
};

module.exports = {
    dispatchJobLifecycleEmails,
    dispatchSavedJobReminders,
    dispatchWalkInInterviewAlerts,
};
