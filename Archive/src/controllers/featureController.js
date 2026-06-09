const { Feature } = require("../models");

// =======================
// 📦 Admin: Create Feature
// =======================
exports.createFeature = async (req, res) => {
    try {
        const feature = await Feature.create(req.body);
        return res.status(201).json(feature);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: "Failed to create feature", error: error.message });
    }
};

// =======================
// 📋 Admin: Get All Features
// =======================
exports.getAllFeatures = async (req, res) => {
    try {
        const features = await Feature.findAll({ order: [["id", "ASC"]] });
        res.json(features);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch features", error: error.message });
    }
};

// =======================
// ✏️ Admin: Update Feature
// =======================
exports.updateFeature = async (req, res) => {
    try {
        const { id } = req.params;
        const feature = await Feature.findByPk(id);
        if (!feature) return res.status(404).json({ message: "Feature not found" });

        await feature.update(req.body);
        res.json(feature);
    } catch (error) {
        res.status(400).json({ message: "Failed to update feature", error: error.message });
    }
};

// =======================
// ❌ Admin: Delete Feature
// =======================
exports.deleteFeature = async (req, res) => {
    try {
        const { id } = req.params;
        const feature = await Feature.findByPk(id);
        if (!feature) return res.status(404).json({ message: "Feature not found" });

        await feature.destroy();
        res.json({ message: "Feature deleted successfully" });
    } catch (error) {
        res.status(400).json({ message: "Failed to delete feature", error: error.message });
    }
};
