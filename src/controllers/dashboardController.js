const { Resume, Application, Job, Company } = require("../models");
const { applyMarketScope } = require("../utils/market");

const STATUS_KEYS = ["pending", "reviewed", "interview", "offered", "hired", "rejected"];

exports.getDashboardOverview = async (req, res) => {
    try {
        const userId =
            typeof req.user?.id === "object" && req.user.id?.id ? req.user.id.id : req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: "Authentication required." });
        }

        const totalResumes = await Resume.count({ where: { userId } });

        const recentResumes = await Resume.findAll({
            where: { userId },
            order: [["updatedAt", "DESC"]],
            limit: 3,
            attributes: ["id", "title", "isPublic", "publicSlug", "updatedAt"],
        });

        const recentApplications = await Application.findAll({
            where: { userId },
            include: [
                {
                    model: Job,
                    as: "job",
                    attributes: ["id", "title", "location", "type", "salaryMin", "salaryMax"],
                    include: [
                        {
                            model: Company,
                            as: "company",
                            attributes: ["id", "name", "logoUrl"],
                        },
                    ],
                },
            ],
            order: [["appliedAt", "DESC"]],
            limit: 5,
        });

        const recommendedJobs = await Job.findAll({
            where: applyMarketScope({ status: "open" }, req, {
                allowAdminOverride: true,
                allowAllForAdmin: false,
            }),
            include: [
                {
                    model: Company,
                    as: "company",
                    attributes: ["id", "name", "logoUrl", "industry"],
                },
            ],
            order: [["createdAt", "DESC"]],
            limit: 5,
            attributes: [
                "id",
                "title",
                "location",
                "type",
                "salaryMin",
                "salaryMax",
                "remote",
                "createdAt",
            ],
        });

        const totalApplications = await Application.count({ where: { userId } });

        const statusRecords = await Application.findAll({
            where: { userId },
            attributes: ["status"],
            raw: true,
        });

        const applicationStatusCounts = STATUS_KEYS.reduce((acc, status) => {
            acc[status] = 0;
            return acc;
        }, {});

        statusRecords.forEach((record) => {
            const status = record.status || "pending";
            applicationStatusCounts[status] = (applicationStatusCounts[status] || 0) + 1;
        });

        const summary = {
            totalResumes,
            totalApplications,
            applicationStatusCounts,
            lastResumeUpdatedAt: recentResumes[0]?.updatedAt || null,
            lastApplicationAt: recentApplications[0]?.appliedAt || null,
        };

        const mapResume = (resume) => ({
            id: resume.id,
            title: resume.title,
            isPublic: resume.isPublic,
            publicSlug: resume.publicSlug,
            updatedAt: resume.updatedAt,
        });

        const mapApplication = (application) => {
            const job = application.job;
            const company = job?.company;
            return {
                id: application.id,
                status: application.status,
                appliedAt: application.appliedAt,
                job: job
                    ? {
                          id: job.id,
                          title: job.title,
                          location: job.location,
                          type: job.type,
                          salaryMin: job.salaryMin,
                          salaryMax: job.salaryMax,
                          company: company
                              ? {
                                    id: company.id,
                                    name: company.name,
                                    logoUrl: company.logoUrl,
                                }
                              : null,
                      }
                    : null,
            };
        };

        const mapJob = (job) => ({
            id: job.id,
            title: job.title,
            location: job.location,
            type: job.type,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            remote: job.remote,
            company: job.company
                ? {
                      id: job.company.id,
                      name: job.company.name,
                      logoUrl: job.company.logoUrl,
                  }
                : null,
        });

        res.json({
            summary,
            recentResumes: recentResumes.map(mapResume),
            recentApplications: recentApplications.map(mapApplication),
            recommendedJobs: recommendedJobs.map(mapJob),
        });
    } catch (err) {
        console.error("❌ Dashboard overview error:", err);
        res.status(500).json({ error: "Failed to load dashboard overview" });
    }
};
