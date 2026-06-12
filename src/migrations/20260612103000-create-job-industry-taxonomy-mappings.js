"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("JobIndustryCategories", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      jobIndustryId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "JobIndustries", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      jobCategoryId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "JobCategories", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("JobIndustryCategories", ["jobIndustryId", "jobCategoryId"], {
      unique: true,
      name: "job_industry_categories_unique",
    });

    await queryInterface.createTable("JobIndustrySkills", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      jobIndustryId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "JobIndustries", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      skillId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Skills", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("JobIndustrySkills", ["jobIndustryId", "skillId"], {
      unique: true,
      name: "job_industry_skills_unique",
    });

    await queryInterface.createTable("JobIndustryFunctions", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      jobIndustryId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "JobIndustries", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      jobFunctionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "JobFunctions", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("JobIndustryFunctions", ["jobIndustryId", "jobFunctionId"], {
      unique: true,
      name: "job_industry_functions_unique",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("JobIndustryFunctions");
    await queryInterface.dropTable("JobIndustrySkills");
    await queryInterface.dropTable("JobIndustryCategories");
  },
};
