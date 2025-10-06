const { Op } = require("sequelize");
const { Job, Company, User, Location } = require("../models");
const { ValidationError } = require("sequelize");

const clean = (val) => (typeof val === "string" ? val.trim().slice(0, 500) : val || null);


// Create a new job
exports.createJob = async (req, res) => {
    try {
        if (req.user.role !== "admin" && req.user.role !== "employer") {
            return res.status(403).json({ error: "Only employers or admins can create jobs" });
        }

        const {
            title,
            description,
            type,
            locationId,
            remote,
            salaryMin,
            salaryMax,
            currency,
            status,
            experienceLevel,
            educationLevel,
            industry,
            skills,
            applicationUrl,
            deadline,
            companyId,
        } = req.body;

        // ✅ Validate required fields
        if (!title || !description || !companyId || !locationId) {
            return res.status(400).json({
                error: "Missing required fields: title, description, company, or location",
            });
        }

        // ✅ Validate company exists
        const company = await Company.findByPk(companyId);
        if (!company) {
            return res.status(400).json({ error: "Invalid company selected" });
        }

        // ✅ Validate location exists
        const location = await Location.findByPk(locationId);
        if (!location) {
            return res.status(400).json({ error: "Invalid location selected" });
        }

        // ✅ Ensure correct ownership
        if (req.user.role === "employer" && company.createdBy !== req.user.id) {
            return res.status(403).json({ error: "You can only post jobs for your own company" });
        }

        // ✅ Create job safely
        const job = await Job.create({
            title: clean(title),
            description: clean(description),
            type: clean(type),
            location: location.name,
            remote: !!remote,
            salaryMin: salaryMin ? parseFloat(salaryMin) : null,
            salaryMax: salaryMax ? parseFloat(salaryMax) : null,
            currency: clean(currency),
            status: status || "open",
            experienceLevel: clean(experienceLevel),
            educationLevel: clean(educationLevel),
            industry: clean(industry),
            skills: clean(skills),
            applicationUrl: clean(applicationUrl),
            deadline: deadline || null,
            postedBy: req.user.id,
            companyId,
            locationId,
        });

        return res.status(201).json(job);
    } catch (err) {
        console.error("❌ Create job error:", err);

        // Sequelize validation errors (missing, too long, wrong enum, etc.)
        if (err instanceof ValidationError) {
            const messages = err.errors.map((e) => `${e.path}: ${e.message}`);
            return res.status(400).json({ error: messages.join(", ") });
        }

        // SQL data truncation (like your case)
        if (err.parent?.sqlMessage?.includes("Data truncated")) {
            return res.status(400).json({
                error: "Invalid data type or too long value. Please check your inputs.",
                details: err.parent.sqlMessage,
            });
        }

        // Default fallback
        return res.status(500).json({
            error: "Failed to create job",
            details: err.message || "Unknown server error",
        });
    }
};


// Get all jobs (with pagination + filters)
exports.listJobs = async (req, res) => {
    try {
        const page = parseInt(req.query.page || "1", 10);
        const limit = parseInt(req.query.limit || "10", 10);
        const offset = (page - 1) * limit;

        // ✅ Start with an empty where object
        const where = {};

        // ✅ Keyword search: match title, description, skills, etc.
        if (req.query.keyword) {
            const keyword = req.query.keyword.trim();
            where[Op.or] = [
                { title: { [Op.like]: `%${keyword}%` } },
                { description: { [Op.like]: `%${keyword}%` } },
                { skills: { [Op.like]: `%${keyword}%` } },
                { industry: { [Op.like]: `%${keyword}%` } },
            ];
        }

        // ✅ Location filter (only match existing `location` column)
        if (req.query.location) {
            const loc = req.query.location.trim();
            where.location = { [Op.like]: `%${loc}%` };
        }

        // ✅ Optional filters
        if (req.query.type) where.type = req.query.type;
        if (req.query.status) where.status = req.query.status;
        if (req.query.experienceLevel) where.experienceLevel = req.query.experienceLevel;
        if (req.query.educationLevel) where.educationLevel = req.query.educationLevel;
        if (req.query.industry) where.industry = req.query.industry;
        if (req.query.remote) where.remote = req.query.remote === "true";

        // ✅ Fetch data with associations
        const { count, rows } = await Job.findAndCountAll({
            where,
            include: [
                {
                    model: Company,
                    as: "company",
                    attributes: ["id", "name", "logoUrl", "industry"],
                },
                {
                    model: User,
                    as: "poster",
                    attributes: ["id", "username", "email"],
                },
            ],
            limit,
            offset,
            order: [["createdAt", "DESC"]],
        });

        res.json({
            total: count,
            page,
            limit,
            jobs: rows,
        });
    } catch (err) {
        console.error("❌ List jobs error:", err);
        res.status(500).json({ error: "Failed to fetch jobs" });
    }
};


// Get single job by ID
exports.getJob = async (req, res) => {
    try {
        const job = await Job.findByPk(req.params.id, {
            include: [
                {
                    model: Company, as: 'company', attributes: [
                        "id",
                        "name",
                        "logoUrl",
                        "industry",
                        "size",
                        "bannerUrl"
                    ]
                },
                { model: User, as: 'poster', attributes: ["id", "username", "email"] }
            ]
        });

        if (!job) return res.status(404).json({ error: "Job not found" });

        // increment views
        job.views += 1;
        await job.save();

        res.json(job);
    } catch (err) {
        console.error("❌ Get job error:", err);
        res.status(500).json({ error: "Failed to fetch job" });
    }
};

// Update job
exports.updateJob = async (req, res) => {
    try {
        const job = await Job.findByPk(req.params.id);
        if (!job) return res.status(404).json({ error: "Job not found" });

        await job.update(req.body);
        res.json(job);
    } catch (err) {
        console.error("❌ Update job error:", err);
        res.status(500).json({ error: "Failed to update job" });
    }
};

// Delete job
exports.deleteJob = async (req, res) => {
    try {
        const job = await Job.findByPk(req.params.id);
        if (!job) return res.status(404).json({ error: "Job not found" });

        await job.destroy();
        res.json({ message: "Job deleted successfully" });
    } catch (err) {
        console.error("❌ Delete job error:", err);
        res.status(500).json({ error: "Failed to delete job" });
    }
};

// In jobController.js
exports.listJobsByCompany = async (req, res) => {
    try {
        const companyId = req.params.companyId;
        const jobs = await Job.findAll({
            where: { companyId },
            include: [
                {
                    model: Company,
                    as: "company", // 👈 important alias
                    attributes: ["id", "name", "logoUrl", "industry"],
                },
            ],
            order: [["createdAt", "DESC"]],
        });
        res.json(jobs);
    } catch (err) {
        console.error("❌ Jobs by company error:", err);
        res.status(500).json({ error: "Failed to fetch jobs for this company" });
    }
};