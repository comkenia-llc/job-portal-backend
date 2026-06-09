"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Users", "headline", { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn("Users", "phone", { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn("Users", "location", { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn("Users", "linkedinUrl", { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn("Users", "portfolioUrl", { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn("Users", "about", { type: Sequelize.TEXT, allowNull: true });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("Users", "headline");
    await queryInterface.removeColumn("Users", "phone");
    await queryInterface.removeColumn("Users", "location");
    await queryInterface.removeColumn("Users", "linkedinUrl");
    await queryInterface.removeColumn("Users", "portfolioUrl");
    await queryInterface.removeColumn("Users", "about");
  },
};
