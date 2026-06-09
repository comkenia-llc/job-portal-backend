const { GlobalSetting } = require("../models");
const { resolveRequestMarket, assignMarketToPayload } = require("../utils/market");

exports.getSettings = async (req, res) => {
    try {
        const { market } = resolveRequestMarket(req, {
            allowAdminOverride: true,
            allowAllForAdmin: false,
        });
        const settings = await GlobalSetting.findOne({
            where: { market },
        });
        if (!settings) return res.json({});
        res.json(settings);
    } catch (err) {
        console.error("❌ getSettings error:", err);
        res.status(500).json({ message: "Error fetching global settings" });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const data = req.body;
        assignMarketToPayload(data, req, { allowAdminOverride: true });
        let settings = await GlobalSetting.findOne({
            where: { market: data.market },
        });
        if (!settings) settings = await GlobalSetting.create({ market: data.market });

        // ✅ Handle file uploads (Multer already saves them)
        if (req.files?.logo?.[0]) {
            data.logo = `/uploads/global/${req.files.logo[0].filename}`;
        }
        if (req.files?.favicon?.[0]) {
            data.favicon = `/uploads/global/${req.files.favicon[0].filename}`;
        }
        if (req.files?.banner_image?.[0]) {
            data.banner_image = `/uploads/global/${req.files.banner_image[0].filename}`;
        }

        // ✅ Parse JSON fields if coming from form-data as strings
        ["custom_scripts", "footer_links", "social_links"].forEach((key) => {
            if (typeof data[key] === "string") {
                try {
                    data[key] = JSON.parse(data[key]);
                } catch {
                    // ignore invalid JSON
                }
            }
        });

        await settings.update(data);
        res.json({ message: "Settings updated successfully", settings });
    } catch (err) {
        console.error("❌ updateSettings error:", err);
        res.status(500).json({ message: "Error updating global settings" });
    }
};
