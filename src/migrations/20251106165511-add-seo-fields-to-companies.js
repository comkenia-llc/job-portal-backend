module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Companies", "seoTitle", Sequelize.STRING);
    await queryInterface.addColumn("Companies", "seoDescription", Sequelize.TEXT);
    await queryInterface.addColumn("Companies", "seoKeywords", Sequelize.TEXT);
    await queryInterface.addColumn("Companies", "canonicalUrl", Sequelize.STRING);
    await queryInterface.addColumn("Companies", "metaImage", Sequelize.STRING);
    await queryInterface.addColumn("Companies", "schemaType", Sequelize.STRING);
    await queryInterface.addColumn("Companies", "faqSchema", Sequelize.JSON);
    await queryInterface.addColumn("Companies", "tags", Sequelize.JSON);
    await queryInterface.addColumn("Companies", "isFeatured", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Companies", "seoTitle");
    await queryInterface.removeColumn("Companies", "seoDescription");
    await queryInterface.removeColumn("Companies", "seoKeywords");
    await queryInterface.removeColumn("Companies", "canonicalUrl");
    await queryInterface.removeColumn("Companies", "metaImage");
    await queryInterface.removeColumn("Companies", "schemaType");
    await queryInterface.removeColumn("Companies", "faqSchema");
    await queryInterface.removeColumn("Companies", "tags");
    await queryInterface.removeColumn("Companies", "isFeatured");
  },
};
