"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("GlobalSettings", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      // Basic Identity
      portal_name: { type: Sequelize.STRING },
      portal_slug: { type: Sequelize.STRING },
      base_url: { type: Sequelize.STRING },

      // Branding
      logo: { type: Sequelize.STRING },
      favicon: { type: Sequelize.STRING },
      banner_image: { type: Sequelize.STRING },
      accent_color: { type: Sequelize.STRING, defaultValue: "#2563eb" },
      secondary_color: { type: Sequelize.STRING, defaultValue: "#facc15" },
      font_family: { type: Sequelize.STRING, defaultValue: "Inter" },

      // SEO
      seo_title: { type: Sequelize.STRING },
      seo_description: { type: Sequelize.TEXT },
      seo_keywords: { type: Sequelize.TEXT },
      canonical_url: { type: Sequelize.STRING },
      meta_image: { type: Sequelize.STRING },
      schema_markup: { type: Sequelize.TEXT },

      // Ads & Scripts
      ads_txt: { type: Sequelize.TEXT },
      custom_scripts: { type: Sequelize.JSON, defaultValue: [] },

      // Footer Section
      footer_about: { type: Sequelize.TEXT },
      footer_links: { type: Sequelize.JSON, defaultValue: [] },
      social_links: { type: Sequelize.JSON, defaultValue: [] },
      copyright_text: { type: Sequelize.STRING },

      // System Settings
      default_language: { type: Sequelize.STRING, defaultValue: "en" },
      default_currency: { type: Sequelize.STRING, defaultValue: "USD" },
      timezone: { type: Sequelize.STRING, defaultValue: "Asia/Dubai" },
      portal_status: {
        type: Sequelize.ENUM("active", "maintenance", "offline"),
        defaultValue: "active",
      },
      maintenance_message: { type: Sequelize.TEXT },

      // Sequelize meta fields
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("GlobalSettings");
  },
};
