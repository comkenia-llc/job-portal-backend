"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class JobAlert extends Model {}

    JobAlert.init(
        {
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: "Users", key: "id" },
            },
            keywords: { type: DataTypes.STRING, allowNull: true },
            location: { type: DataTypes.STRING, allowNull: true },
            jobType: { type: DataTypes.STRING, allowNull: true },
            category: { type: DataTypes.STRING, allowNull: true },
            salaryMin: { type: DataTypes.INTEGER, allowNull: true },
            frequency: {
                type: DataTypes.ENUM("daily", "weekly"),
                defaultValue: "daily",
            },
            isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
            lastSentAt: { type: DataTypes.DATE, allowNull: true },
        },
        {
            sequelize,
            modelName: "JobAlert",
            tableName: "JobAlerts",
        }
    );

    return JobAlert;
};
