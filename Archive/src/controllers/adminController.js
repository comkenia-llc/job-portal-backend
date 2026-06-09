const { User, Company, Job, Location } = require("../models");
const { Op, fn, col, literal } = require("sequelize");

exports.getAdminStats = async (req, res) => {
    try {
        console.log("📊 Fetching platform statistics...");

        const [users, companies, jobs, locations] = await Promise.all([
            User.count(),
            Company.count(),
            Job.count(),
            Location.count(),
        ]);

        res.json({
            users,
            companies,
            jobs,
            locations,
        });
    } catch (err) {
        console.error("❌ getAdminStats error:", err);
        res.status(500).json({ error: "Failed to load admin stats" });
    }
};

exports.getAnalytics = async (req, res) => {
    try {
        console.log("📊 Generating full analytics...");

        // 🕒 Jobs per day (7 days)
        const jobsPerDay = await Job.findAll({
            attributes: [
                [fn("DATE", col("createdAt")), "date"],
                [fn("COUNT", col("id")), "count"],
            ],
            where: {
                createdAt: { [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            },
            group: [literal("DATE(createdAt)")],
            order: [[literal("DATE(createdAt)"), "ASC"]],
            raw: true,
        });

        // 👤 Users per day (7 days)
        const usersPerDay = await User.findAll({
            attributes: [
                [fn("DATE", col("createdAt")), "date"],
                [fn("COUNT", col("id")), "count"],
            ],
            where: {
                createdAt: { [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            },
            group: [literal("DATE(createdAt)")],
            order: [[literal("DATE(createdAt)"), "ASC"]],
            raw: true,
        });

        // 🏢 Top 5 companies by job count
        const topCompanies = await Job.findAll({
            attributes: ["companyId", [fn("COUNT", col("Job.id")), "count"]],
            include: [{ model: Company, as: "company", attributes: ["id", "name"] }],
            group: ["companyId", "company.id", "company.name"],
            order: [[fn("COUNT", col("Job.id")), "DESC"]],
            limit: 5,
            raw: true,
            nest: true,
        });

        // 🌍 Top 5 locations by job count (⚙️ fixed alias)
        const topLocations = await Job.findAll({
            attributes: ["locationId", [fn("COUNT", col("Job.id")), "count"]],
            include: [{ model: Location, as: "jobLocation", attributes: ["id", "name"] }],
            group: ["locationId", "jobLocation.id", "jobLocation.name"], // ✅ fixed group
            order: [[fn("COUNT", col("Job.id")), "DESC"]],
            limit: 5,
            raw: true,
            nest: true,
        });

        res.json({
            jobsPerDay,
            usersPerDay,
            topCompanies,
            topLocations,
        });
    } catch (err) {
        console.error("❌ getAnalytics error:", err);
        res.status(500).json({ error: "Failed to load analytics" });
    }
};
