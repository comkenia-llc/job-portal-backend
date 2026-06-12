"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Jobs", "jobIndustryId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "JobIndustries",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    await queryInterface.addIndex("Jobs", ["jobIndustryId"]);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("Jobs", ["jobIndustryId"]);
    await queryInterface.removeColumn("Jobs", "jobIndustryId");
  },
};