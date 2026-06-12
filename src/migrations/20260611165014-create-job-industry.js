"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("JobIndustries", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      market: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "global",
      },
      description: Sequelize.TEXT,
      content: Sequelize.TEXT,
      seoTitle: Sequelize.STRING,
      seoDescription: Sequelize.TEXT,
      seoKeywords: Sequelize.TEXT,
      canonicalUrl: Sequelize.STRING,
      metaImage: Sequelize.STRING,
      schemaType: {
        type: Sequelize.STRING,
        defaultValue: "DefinedTerm",
      },
      faqSchema: Sequelize.JSON,
      tags: Sequelize.JSON,
      isFeatured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: "active",
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addIndex("JobIndustries", ["slug"]);
    await queryInterface.addIndex("JobIndustries", ["market"]);
    await queryInterface.addIndex("JobIndustries", ["status"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("JobIndustries");
  },
};