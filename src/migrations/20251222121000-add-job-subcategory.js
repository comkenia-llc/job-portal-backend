"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn("Jobs", "jobSubCategoryId", {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: "JobCategories", key: "id" },
            onDelete: "SET NULL",
        });
        await queryInterface.addIndex("Jobs", ["jobSubCategoryId"], { name: "jobs_jobSubCategoryId_idx" });
    },

    async down(queryInterface) {
        await queryInterface.removeIndex("Jobs", "jobs_jobSubCategoryId_idx");
        await queryInterface.removeColumn("Jobs", "jobSubCategoryId");
    },
};
