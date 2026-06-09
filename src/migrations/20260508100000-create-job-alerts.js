"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("JobAlerts", {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
            userId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: "Users", key: "id" },
                onDelete: "CASCADE",
            },
            keywords: { type: Sequelize.STRING, allowNull: true },
            location: { type: Sequelize.STRING, allowNull: true },
            jobType: { type: Sequelize.STRING, allowNull: true },
            category: { type: Sequelize.STRING, allowNull: true },
            salaryMin: { type: Sequelize.INTEGER, allowNull: true },
            frequency: {
                type: Sequelize.ENUM("daily", "weekly"),
                defaultValue: "daily",
            },
            isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
            lastSentAt: { type: Sequelize.DATE, allowNull: true },
            createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
            updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable("JobAlerts");
    },
};
