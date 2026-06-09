const { SavedJob, Job, Company } = require("../models");

exports.listSavedJobs = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Authentication required" });

        const saved = await SavedJob.findAll({
            where: { userId },
            include: [
                {
                    model: Job,
                    as: "job",
                    include: [{ model: Company, as: "company", attributes: ["id", "name", "logoUrl", "industry"] }],
                },
            ],
            order: [["createdAt", "DESC"]],
        });

        res.json(saved);
    } catch (err) {
        console.error("❌ listSavedJobs error:", err);
        res.status(500).json({ error: "Failed to load saved jobs" });
    }
};

exports.saveJob = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { jobId } = req.body;
        if (!userId) return res.status(401).json({ error: "Authentication required" });
        if (!jobId) return res.status(400).json({ error: "jobId is required" });

        const job = await Job.findByPk(jobId);
        if (!job) return res.status(404).json({ error: "Job not found" });

        const [saved] = await SavedJob.findOrCreate({
            where: { userId, jobId },
            defaults: { userId, jobId },
        });

        res.status(201).json(saved);
    } catch (err) {
        console.error("❌ saveJob error:", err);
        res.status(500).json({ error: "Failed to save job" });
    }
};

exports.removeSavedJob = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { jobId } = req.params;
        if (!userId) return res.status(401).json({ error: "Authentication required" });

        const deleted = await SavedJob.destroy({ where: { userId, jobId } });
        if (!deleted) return res.status(404).json({ error: "Saved job not found" });

        res.json({ message: "Removed from saved jobs" });
    } catch (err) {
        console.error("❌ removeSavedJob error:", err);
        res.status(500).json({ error: "Failed to remove saved job" });
    }
};
