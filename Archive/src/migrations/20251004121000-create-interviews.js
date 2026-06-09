"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("Interviews", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            applicationId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: "Applications", key: "id" },
                onDelete: "CASCADE",
            },
            jobId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: "Jobs", key: "id" },
                onDelete: "CASCADE",
            },
            candidateId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: "Users", key: "id" },
                onDelete: "CASCADE",
            },
            createdBy: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: "Users", key: "id" },
                onDelete: "SET NULL",
            },
            scheduledFor: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            status: {
                type: Sequelize.ENUM(
                    "scheduled",
                    "interviewed",
                    "hired",
                    "canceled",
                    "rescheduled",
                    "completed"
                ),
                defaultValue: "scheduled",
            },
            type: { type: Sequelize.STRING },
            location: { type: Sequelize.STRING },
            meetingLink: { type: Sequelize.STRING },
            interviewerName: { type: Sequelize.STRING },
            timezone: { type: Sequelize.STRING },
            notes: { type: Sequelize.TEXT },
            rescheduleNote: { type: Sequelize.TEXT },
            calendarInviteUrl: { type: Sequelize.STRING },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn("NOW"),
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn("NOW"),
            },
        });

        await queryInterface.addIndex("Interviews", ["jobId"]);
        await queryInterface.addIndex("Interviews", ["applicationId"]);
        await queryInterface.addIndex("Interviews", ["candidateId"]);
        await queryInterface.addIndex("Interviews", ["status"]);
    },

    async down(queryInterface) {
        await queryInterface.dropTable("Interviews");
    },
};
