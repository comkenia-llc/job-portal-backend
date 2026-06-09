"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("SkillCategories", {
            id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
            name: { type: Sequelize.STRING, allowNull: false },
            slug: { type: Sequelize.STRING, allowNull: false, unique: true },
            description: { type: Sequelize.TEXT, allowNull: true },
            isFeatured: { type: Sequelize.BOOLEAN, defaultValue: false },
            createdAt: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
            },
            updatedAt: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
            },
        });

        await queryInterface.addColumn("Skills", "categoryId", {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: "SkillCategories", key: "id" },
            onUpdate: "CASCADE",
            onDelete: "SET NULL",
        });
        await queryInterface.addIndex("Skills", ["categoryId"]);
    },

    async down(queryInterface) {
        await queryInterface.removeColumn("Skills", "categoryId");
        await queryInterface.dropTable("SkillCategories");
    },
};
