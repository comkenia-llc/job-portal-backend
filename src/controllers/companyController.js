const { Company } = require('../models');

// Create company
exports.createCompany = async (req, res) => {
    try {
        const data = req.body;
        data.createdBy = req.user.id;

        // ✅ Convert empty strings to null
        Object.keys(data).forEach((key) => {
            if (data[key] === "") data[key] = null;
        });

        // ✅ Handle file uploads
        if (req.files?.logo) {
            data.logoUrl = `/uploads/companies/${req.files.logo[0].filename}`;
        }
        if (req.files?.banner) {
            data.bannerUrl = `/uploads/companies/${req.files.banner[0].filename}`;
        }

        // ✅ Required field check
        if (!data.name) {
            return res.status(400).json({ error: "Company name is required" });
        }
        if (!data.industry) {
            return res.status(400).json({ error: "Industry is required" });
        }

        const company = await Company.create(data);
        res.status(201).json(company);
    } catch (err) {
        console.error("❌ Create company error:", err);
        res.status(500).json({ error: "Server error" });
    }
};


// Update company
exports.updateCompany = async (req, res) => {
    try {
        const company = await Company.findByPk(req.params.id);
        if (!company) return res.status(404).json({ error: "Company not found" });

        const data = req.body;

        // If new files uploaded
        if (req.files?.logo) {
            data.logoUrl = `/uploads/companies/${req.files.logo[0].filename}`;
        }
        if (req.files?.banner) {
            data.bannerUrl = `/uploads/companies/${req.files.banner[0].filename}`;
        }

        await company.update(data);
        res.json(company);
    } catch (err) {
        console.error("❌ Update company error:", err);
        res.status(500).json({ error: "Server error" });
    }
};


// Get all companies (with optional filters later)
exports.getCompanies = async (req, res) => {
    try {
        const companies = await Company.findAll();
        res.json(companies);
    } catch (err) {
        console.error("❌ Get companies error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

// Get company by ID
exports.getCompanyById = async (req, res) => {
    try {
        const company = await Company.findByPk(req.params.id);
        if (!company) return res.status(404).json({ error: "Company not found" });
        res.json(company);
    } catch (err) {
        console.error("❌ Get company error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

// Delete company
exports.deleteCompany = async (req, res) => {
    try {
        const company = await Company.findByPk(req.params.id);
        if (!company) return res.status(404).json({ error: "Company not found" });

        await company.destroy();
        res.json({ message: "Company deleted" });
    } catch (err) {
        console.error("❌ Delete company error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

exports.getAllCompaniesAdmin = async (req, res) => {
    try {
        const companies = await Company.findAll({
            order: [["createdAt", "DESC"]],
        });
        res.json({ companies });
    } catch (err) {
        console.error("❌ Admin getAllCompanies error:", err);
        res.status(500).json({ error: "Failed to fetch all companies" });
    }
};
