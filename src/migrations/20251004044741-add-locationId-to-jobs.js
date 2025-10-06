"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Jobs", "locationId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Locations", // ✅ your new table
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Jobs", "locationId");
  },
};
