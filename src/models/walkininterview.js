"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class WalkInInterview extends Model { }

    WalkInInterview.init(
        {
            title: { type: DataTypes.STRING, allowNull: false },
            slug: { type: DataTypes.STRING, allowNull: false, unique: true },

            companyId: { type: DataTypes.INTEGER, allowNull: false },
            locationId: { type: DataTypes.INTEGER, allowNull: false },

            interviewStartDate: { type: DataTypes.DATE, allowNull: false },
            interviewEndDate: { type: DataTypes.DATE, allowNull: true },
            interviewTime: { type: DataTypes.STRING, allowNull: true },

            venueDetails: { type: DataTypes.TEXT, allowNull: true },
            mapUrl: { type: DataTypes.STRING, allowNull: true },

            contactEmail: { type: DataTypes.STRING, allowNull: true },
            contactPhone: { type: DataTypes.STRING, allowNull: true },
            whatsapp: { type: DataTypes.STRING, allowNull: true },

            requirements: { type: DataTypes.TEXT, allowNull: true },
            documentsRequired: { type: DataTypes.TEXT, allowNull: true },
            instructions: { type: DataTypes.TEXT, allowNull: true },

            status: {
                type: DataTypes.ENUM("open", "closed", "draft", "expired"),
                defaultValue: "open",
            },

            isFeatured: { type: DataTypes.BOOLEAN, defaultValue: false },
            views: { type: DataTypes.INTEGER, defaultValue: 0 },

            seoTitle: DataTypes.STRING,
            seoDescription: DataTypes.TEXT,
            seoKeywords: DataTypes.TEXT,

            createdBy: DataTypes.INTEGER,
        },
        {
            sequelize,
            modelName: "WalkInInterview",
            tableName: "WalkInInterviews",
        }
    );

    return WalkInInterview;
};