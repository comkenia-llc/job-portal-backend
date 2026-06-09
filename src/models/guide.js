"use strict";
module.exports = (sequelize, DataTypes) => {
    const Guide = sequelize.define(
        "Guide",
        {
            market: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "global",
            },
            type: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            slug: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            title: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            summary: {
                type: DataTypes.TEXT,
            },
            content: {
                type: DataTypes.TEXT("long"),
            },
            payload: {
                type: DataTypes.TEXT("long"),
            },
            faqs: {
                type: DataTypes.TEXT,
            },
            tags: {
                type: DataTypes.TEXT,
            },
            coverImage: {
                type: DataTypes.STRING,
            },
            readingMinutes: {
                type: DataTypes.INTEGER,
            },
            status: {
                type: DataTypes.ENUM("draft", "published"),
                defaultValue: "draft",
            },
            publishedAt: {
                type: DataTypes.DATE,
            },
            seoTitle: {
                type: DataTypes.STRING,
            },
            seoDescription: {
                type: DataTypes.TEXT,
            },
            seoKeywords: {
                type: DataTypes.TEXT,
            },
            canonicalUrl: {
                type: DataTypes.STRING,
            },
            metaImage: {
                type: DataTypes.STRING,
            },
            schemaType: {
                type: DataTypes.STRING,
            },
            authorId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
        },
        {
            tableName: "Guides",
        }
    );

    return Guide;
};
