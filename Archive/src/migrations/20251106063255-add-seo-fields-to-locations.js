"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Locations", "flag", { type: Sequelize.STRING });
    await queryInterface.addColumn("Locations", "image", { type: Sequelize.STRING });
    await queryInterface.addColumn("Locations", "metaImage", { type: Sequelize.STRING });
    await queryInterface.addColumn("Locations", "seoTitle", { type: Sequelize.STRING });
    await queryInterface.addColumn("Locations", "seoDescription", { type: Sequelize.TEXT });
    await queryInterface.addColumn("Locations", "seoKeywords", { type: Sequelize.TEXT });
    await queryInterface.addColumn("Locations", "canonicalUrl", { type: Sequelize.STRING });
    await queryInterface.addColumn("Locations", "schemaType", { type: Sequelize.STRING });
    await queryInterface.addColumn("Locations", "faqSchema", { type: Sequelize.JSON });
    await queryInterface.addColumn("Locations", "tags", { type: Sequelize.JSON });
    await queryInterface.addColumn("Locations", "isFeatured", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("Locations", "flag");
    await queryInterface.removeColumn("Locations", "image");
    await queryInterface.removeColumn("Locations", "metaImage");
    await queryInterface.removeColumn("Locations", "seoTitle");
    await queryInterface.removeColumn("Locations", "seoDescription");
    await queryInterface.removeColumn("Locations", "seoKeywords");
    await queryInterface.removeColumn("Locations", "canonicalUrl");
    await queryInterface.removeColumn("Locations", "schemaType");
    await queryInterface.removeColumn("Locations", "faqSchema");
    await queryInterface.removeColumn("Locations", "tags");
    await queryInterface.removeColumn("Locations", "isFeatured");
  },
};
