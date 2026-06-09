"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class WalkInInterviewRole extends Model { }

    WalkInInterviewRole.init(
        {
            walkInInterviewId: { type: DataTypes.INTEGER, allowNull: false },
            title: { type: DataTypes.STRING, allowNull: false },

            salaryMin: DataTypes.INTEGER,
            salaryMax: DataTypes.INTEGER,

            currency: {
                type: DataTypes.STRING,
                defaultValue: "AED",
            },

            experienceLevel: {
                type: DataTypes.ENUM("entry", "junior", "mid", "senior", "lead", "executive"),
                allowNull: true,
            },

            description: DataTypes.TEXT,
        },
        {
            sequelize,
            modelName: "WalkInInterviewRole",
            tableName: "WalkInInterviewRoles",
        }
    );

    return WalkInInterviewRole;
};