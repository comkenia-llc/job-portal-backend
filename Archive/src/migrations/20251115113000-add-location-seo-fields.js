"use strict";

const TABLE = "Locations";

module.exports = {
    async up(queryInterface, Sequelize) {
        const tableDefinition = await queryInterface.describeTable(TABLE);
        const addColumnIfMissing = async (column, definition) => {
            if (!tableDefinition[column]) {
                await queryInterface.addColumn(TABLE, column, definition);
            }
        };

        await addColumnIfMissing("flag", {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: "/uploads/flags/default.png",
        });
        await addColumnIfMissing("image", {
            type: Sequelize.STRING,
            allowNull: true,
        });
        await addColumnIfMissing("metaImage", {
            type: Sequelize.STRING,
            allowNull: true,
        });
        await addColumnIfMissing("seoTitle", {
            type: Sequelize.STRING,
            allowNull: true,
        });
        await addColumnIfMissing("seoDescription", {
            type: Sequelize.TEXT,
            allowNull: true,
        });
        await addColumnIfMissing("seoKeywords", {
            type: Sequelize.STRING,
            allowNull: true,
        });
        await addColumnIfMissing("canonicalUrl", {
            type: Sequelize.STRING,
            allowNull: true,
        });
        await addColumnIfMissing("schemaType", {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: "Place",
        });
        await addColumnIfMissing("faqSchema", {
            type: Sequelize.JSON,
            allowNull: true,
        });
        await addColumnIfMissing("tags", {
            type: Sequelize.JSON,
            allowNull: true,
        });
        await addColumnIfMissing("isFeatured", {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        });
        await addColumnIfMissing("lastUpdated", {
            type: Sequelize.DATE,
            allowNull: true,
            defaultValue: Sequelize.fn("NOW"),
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn(TABLE, "lastUpdated");
        await queryInterface.removeColumn(TABLE, "isFeatured");
        await queryInterface.removeColumn(TABLE, "tags");
        await queryInterface.removeColumn(TABLE, "faqSchema");
        await queryInterface.removeColumn(TABLE, "schemaType");
        await queryInterface.removeColumn(TABLE, "canonicalUrl");
        await queryInterface.removeColumn(TABLE, "seoKeywords");
        await queryInterface.removeColumn(TABLE, "seoDescription");
        await queryInterface.removeColumn(TABLE, "seoTitle");
        await queryInterface.removeColumn(TABLE, "metaImage");
        await queryInterface.removeColumn(TABLE, "image");
        await queryInterface.removeColumn(TABLE, "flag");
    },
};
