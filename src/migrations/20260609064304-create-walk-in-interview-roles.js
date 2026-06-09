"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("WalkInInterviewRoles", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },

      walkInInterviewId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "WalkInInterviews", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      title: { type: Sequelize.STRING, allowNull: false },

      salaryMin: { type: Sequelize.INTEGER, allowNull: true },
      salaryMax: { type: Sequelize.INTEGER, allowNull: true },
      currency: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "AED",
      },

      experienceLevel: {
        type: Sequelize.ENUM("entry", "junior", "mid", "senior", "lead", "executive"),
        allowNull: true,
      },

      description: { type: Sequelize.TEXT, allowNull: true },

      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex("WalkInInterviewRoles", ["walkInInterviewId"], {
      name: "walkin_roles_interview_idx",
    });

    await queryInterface.addIndex("WalkInInterviewRoles", ["title"], {
      name: "walkin_roles_title_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("WalkInInterviewRoles");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_WalkInInterviewRoles_experienceLevel";').catch(() => { });
  },
};