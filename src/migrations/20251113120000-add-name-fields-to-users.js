"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Users", "firstName", {
      type: Sequelize.STRING,
      allowNull: true,
      after: "username",
    });

    await queryInterface.addColumn("Users", "lastName", {
      type: Sequelize.STRING,
      allowNull: true,
      after: "firstName",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("Users", "firstName");
    await queryInterface.removeColumn("Users", "lastName");
  },
};
