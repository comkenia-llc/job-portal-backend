"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Companies", "locationId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "Locations", key: "id" },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("Companies", "locationId");
  },
};
