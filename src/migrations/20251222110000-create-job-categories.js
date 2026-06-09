"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("JobCategories", {
            id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
            name: { type: Sequelize.STRING, allowNull: false },
            slug: { type: Sequelize.STRING, allowNull: false, unique: true },
            description: { type: Sequelize.TEXT, allowNull: true },
            isFeatured: { type: Sequelize.BOOLEAN, defaultValue: false },
            parentId: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: "JobCategories", key: "id" },
                onDelete: "SET NULL",
            },
            createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
            updatedAt: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
            },
        });

        await queryInterface.addColumn("Jobs", "jobCategoryId", {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: "JobCategories", key: "id" },
            onDelete: "SET NULL",
        });
        await queryInterface.addIndex("JobCategories", ["slug"], { unique: true, name: "job_categories_slug_unique" });
        await queryInterface.addIndex("Jobs", ["jobCategoryId"], { name: "jobs_jobCategoryId_idx" });
    },

    async down(queryInterface) {
        await queryInterface.removeIndex("Jobs", "jobs_jobCategoryId_idx");
        await queryInterface.removeColumn("Jobs", "jobCategoryId");
        await queryInterface.removeIndex("JobCategories", "job_categories_slug_unique");
        await queryInterface.dropTable("JobCategories");
    },
};
