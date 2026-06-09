"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Applications", "resumeId", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn("Applications", "coverLetter", {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn("Applications", "attachments", {
      type: Sequelize.JSON,
      allowNull: true,
    });

    await queryInterface.addColumn("Applications", "applicantIp", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Applications", "resumeId");
    await queryInterface.removeColumn("Applications", "coverLetter");
    await queryInterface.removeColumn("Applications", "attachments");
    await queryInterface.removeColumn("Applications", "applicantIp");
  },
};
