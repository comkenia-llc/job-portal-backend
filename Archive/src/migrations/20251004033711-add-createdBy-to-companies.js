"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Companies", "createdBy", {
      type: Sequelize.INTEGER,
      allowNull: true, // ✅ allow NULL for now
      references: {
        model: "Users",
        key: "id",
      },
      onDelete: "CASCADE",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("Companies", "createdBy");
  },
};
