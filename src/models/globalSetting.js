// models/GlobalSetting.js
module.exports = (sequelize, DataTypes) => {
    const GlobalSetting = sequelize.define("GlobalSetting", {
        market: { type: DataTypes.STRING, allowNull: false, defaultValue: "global" },
        portal_name: { type: DataTypes.STRING },
        portal_slug: { type: DataTypes.STRING },
        base_url: { type: DataTypes.STRING },

        // Branding
        logo: { type: DataTypes.STRING },
        favicon: { type: DataTypes.STRING },
        banner_image: { type: DataTypes.STRING },
        accent_color: { type: DataTypes.STRING, defaultValue: "#2563eb" },
        secondary_color: { type: DataTypes.STRING, defaultValue: "#facc15" },
        font_family: { type: DataTypes.STRING, defaultValue: "Inter" },

        // SEO
        seo_title: { type: DataTypes.STRING },
        seo_description: { type: DataTypes.TEXT },
        seo_keywords: { type: DataTypes.TEXT },
        canonical_url: { type: DataTypes.STRING },
        meta_image: { type: DataTypes.STRING },
        schema_markup: { type: DataTypes.TEXT },

        // Ads & Scripts
        ads_txt: { type: DataTypes.TEXT },
        custom_scripts: {
            type: DataTypes.JSON,
            defaultValue: []
            /*
            Example:
            [
              {
                "name": "Google Analytics",
                "position": "head",
                "enabled": true,
                "code": "<script>...</script>"
              }
            ]
            */
        },

        // Footer Section
        footer_about: { type: DataTypes.TEXT },
        footer_links: { type: DataTypes.JSON, defaultValue: [] },
        social_links: { type: DataTypes.JSON, defaultValue: [] },
        copyright_text: { type: DataTypes.STRING },

        // System Settings
        default_language: { type: DataTypes.STRING, defaultValue: "en" },
        default_currency: { type: DataTypes.STRING, defaultValue: "USD" },
        timezone: { type: DataTypes.STRING, defaultValue: "UTC" },
        portal_status: {
            type: DataTypes.ENUM("active", "maintenance", "offline"),
            defaultValue: "active",
        },
        maintenance_message: { type: DataTypes.TEXT },
    });

    return GlobalSetting;
};
