"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("JobCategories", "content", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn("JobCategories", "faqs", {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn("CompanyCategories", "content", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn("CompanyCategories", "faqs", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("JobCategories", "faqs");
    await queryInterface.removeColumn("JobCategories", "content");
    await queryInterface.removeColumn("CompanyCategories", "faqs");
    await queryInterface.removeColumn("CompanyCategories", "content");
  },
};
