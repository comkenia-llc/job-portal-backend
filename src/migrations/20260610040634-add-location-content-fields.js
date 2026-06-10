"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("locations", "overview", {
      type: Sequelize.TEXT("long"),
      allowNull: true,
    });

    await queryInterface.addColumn("locations", "workCulture", {
      type: Sequelize.TEXT("long"),
      allowNull: true,
    });

    await queryInterface.addColumn("locations", "jobMarketOverview", {
      type: Sequelize.TEXT("long"),
      allowNull: true,
    });

    await queryInterface.addColumn("locations", "popularIndustries", {
      type: Sequelize.JSON,
      allowNull: true,
    });

    await queryInterface.addColumn("locations", "popularJobTypes", {
      type: Sequelize.JSON,
      allowNull: true,
    });

    await queryInterface.addColumn("locations", "transportNotes", {
      type: Sequelize.TEXT("long"),
      allowNull: true,
    });

    await queryInterface.addColumn("locations", "lifestyleNotes", {
      type: Sequelize.TEXT("long"),
      allowNull: true,
    });

    await queryInterface.addColumn("locations", "nearbyAreas", {
      type: Sequelize.JSON,
      allowNull: true,
    });

    await queryInterface.addColumn("locations", "candidateTips", {
      type: Sequelize.TEXT("long"),
      allowNull: true,
    });

    await queryInterface.addColumn("locations", "employerNotes", {
      type: Sequelize.TEXT("long"),
      allowNull: true,
    });

    await queryInterface.addColumn("locations", "contentStatus", {
      type: Sequelize.ENUM(
        "empty",
        "draft",
        "reviewed",
        "published"
      ),
      allowNull: false,
      defaultValue: "empty",
    });

    await queryInterface.addColumn("locations", "indexStatus", {
      type: Sequelize.ENUM(
        "auto",
        "index",
        "noindex"
      ),
      allowNull: false,
      defaultValue: "auto",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("locations", "overview");
    await queryInterface.removeColumn("locations", "workCulture");
    await queryInterface.removeColumn("locations", "jobMarketOverview");
    await queryInterface.removeColumn("locations", "popularIndustries");
    await queryInterface.removeColumn("locations", "popularJobTypes");
    await queryInterface.removeColumn("locations", "transportNotes");
    await queryInterface.removeColumn("locations", "lifestyleNotes");
    await queryInterface.removeColumn("locations", "nearbyAreas");
    await queryInterface.removeColumn("locations", "candidateTips");
    await queryInterface.removeColumn("locations", "employerNotes");
    await queryInterface.removeColumn("locations", "contentStatus");
    await queryInterface.removeColumn("locations", "indexStatus");

    await queryInterface.sequelize.query(
      "DROP TYPE IF EXISTS enum_locations_contentStatus;"
    );

    await queryInterface.sequelize.query(
      "DROP TYPE IF EXISTS enum_locations_indexStatus;"
    );
  },
};