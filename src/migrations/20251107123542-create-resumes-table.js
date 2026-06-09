"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Resumes", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      template: {
        type: Sequelize.STRING,
        defaultValue: "modern-yellow",
      },
      photoUrl: {
        type: Sequelize.STRING,
      },
      publicSlug: {
        type: Sequelize.STRING,
        unique: true,
      },
      isPublic: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      isDefault: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },

      personalInfo: Sequelize.JSON,
      summary: Sequelize.TEXT,
      experience: Sequelize.JSON,
      education: Sequelize.JSON,
      skills: Sequelize.JSON,
      languages: Sequelize.JSON,
      projects: Sequelize.JSON,
      certifications: Sequelize.JSON,
      awards: Sequelize.JSON,
      interests: Sequelize.JSON,
      customSections: Sequelize.JSON,

      colorTheme: {
        type: Sequelize.STRING,
        defaultValue: "#2563eb",
      },
      fontStyle: {
        type: Sequelize.STRING,
        defaultValue: "Inter",
      },
      lastGeneratedPdf: Sequelize.STRING,

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Resumes");
  },
};
