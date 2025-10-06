const { Op } = require("sequelize");
const { Location } = require("../models");

exports.create = async (req, res) => {
    try {
        const location = await Location.create(req.body);
        res.status(201).json(location);
    } catch (err) {
        console.error("❌ Create location error:", err);
        res.status(500).json({ error: "Failed to create location" });
    }
};

exports.list = async (req, res) => {
    try {
        const locations = await Location.findAll({
            include: [{ model: Location, as: "children" }],
            order: [["name", "ASC"]],
        });
        res.json(locations);
    } catch (err) {
        console.error("❌ Fetch locations error:", err);
        res.status(500).json({ error: "Failed to fetch locations" });
    }
};

exports.delete = async (req, res) => {
    try {
        await Location.destroy({ where: { id: req.params.id } });
        res.json({ message: "Location deleted" });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete location" });
    }
};

// GET /api/locations/search?q=Dubai
exports.searchLocations = async (req, res) => {
    try {
        const q = req.query.q?.trim() || "";

        const where = q ? { name: { [Op.like]: `%${q}%` } } : {};

        const locations = await Location.findAll({
            where,
            limit: 10,
            order: [["createdAt", "DESC"]],
        });

        res.json({ locations });
    } catch (err) {
        console.error("❌ searchLocations error:", err);
        res.status(500).json({ error: "Failed to search locations" });
    }
};


