"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("CompanyCategories", {
            id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
            name: { type: Sequelize.STRING, allowNull: false },
            slug: { type: Sequelize.STRING, allowNull: false, unique: true },
            description: { type: Sequelize.TEXT, allowNull: true },
            isFeatured: { type: Sequelize.BOOLEAN, defaultValue: false },
            parentId: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: "CompanyCategories", key: "id" },
                onDelete: "SET NULL",
            },
            createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
            updatedAt: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
            },
        });

        await queryInterface.addColumn("Companies", "companyCategoryId", {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: "CompanyCategories", key: "id" },
            onDelete: "SET NULL",
        });

        await queryInterface.addIndex("CompanyCategories", ["slug"], {
            unique: true,
            name: "company_categories_slug_unique",
        });
        await queryInterface.addIndex("Companies", ["companyCategoryId"], {
            name: "companies_companyCategoryId_idx",
        });
    },

    async down(queryInterface) {
        await queryInterface.removeIndex("Companies", "companies_companyCategoryId_idx");
        await queryInterface.removeColumn("Companies", "companyCategoryId");
        await queryInterface.removeIndex("CompanyCategories", "company_categories_slug_unique");
        await queryInterface.dropTable("CompanyCategories");
    },
};
