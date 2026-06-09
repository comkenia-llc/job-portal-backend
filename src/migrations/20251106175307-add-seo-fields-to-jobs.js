"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Jobs", "seoTitle", { type: Sequelize.STRING });
    await queryInterface.addColumn("Jobs", "seoDescription", { type: Sequelize.TEXT });
    await queryInterface.addColumn("Jobs", "seoKeywords", { type: Sequelize.TEXT });
    await queryInterface.addColumn("Jobs", "canonicalUrl", { type: Sequelize.STRING });
    await queryInterface.addColumn("Jobs", "metaImage", { type: Sequelize.STRING });
    await queryInterface.addColumn("Jobs", "schemaType", { type: Sequelize.STRING, defaultValue: "JobPosting" });
    await queryInterface.addColumn("Jobs", "faqSchema", { type: Sequelize.JSON });
    await queryInterface.addColumn("Jobs", "tags", { type: Sequelize.JSON });
    await queryInterface.addColumn("Jobs", "isFeatured", { type: Sequelize.BOOLEAN, defaultValue: false });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("Jobs", "seoTitle");
    await queryInterface.removeColumn("Jobs", "seoDescription");
    await queryInterface.removeColumn("Jobs", "seoKeywords");
    await queryInterface.removeColumn("Jobs", "canonicalUrl");
    await queryInterface.removeColumn("Jobs", "metaImage");
    await queryInterface.removeColumn("Jobs", "schemaType");
    await queryInterface.removeColumn("Jobs", "faqSchema");
    await queryInterface.removeColumn("Jobs", "tags");
    await queryInterface.removeColumn("Jobs", "isFeatured");
  },
};
