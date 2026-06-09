"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Jobs", "isWalkInInterview", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn("Jobs", "walkInInterviewDate", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("Jobs", "walkInInterviewEndDate", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("Jobs", "walkInInterviewTime", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("Jobs", "walkInInterviewLocation", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("Jobs", "walkInInterviewMapUrl", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("Jobs", "walkInInterviewInstructions", {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn("Jobs", "walkInInterviewEmirate", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addIndex(
      "Jobs",
      ["isWalkInInterview", "status", "walkInInterviewDate"],
      {
        name: "jobs_walkin_status_date_idx",
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      "Jobs",
      "jobs_walkin_status_date_idx"
    );

    await queryInterface.removeColumn("Jobs", "walkInInterviewEmirate");
    await queryInterface.removeColumn("Jobs", "walkInInterviewInstructions");
    await queryInterface.removeColumn("Jobs", "walkInInterviewMapUrl");
    await queryInterface.removeColumn("Jobs", "walkInInterviewLocation");
    await queryInterface.removeColumn("Jobs", "walkInInterviewTime");
    await queryInterface.removeColumn("Jobs", "walkInInterviewEndDate");
    await queryInterface.removeColumn("Jobs", "walkInInterviewDate");
    await queryInterface.removeColumn("Jobs", "isWalkInInterview");
  },
};