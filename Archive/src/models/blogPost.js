"use strict";
module.exports = (sequelize, DataTypes) => {
    const BlogPost = sequelize.define(
        "BlogPost",
        {
            title: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            slug: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            excerpt: {
                type: DataTypes.TEXT,
            },
            content: {
                type: DataTypes.TEXT("long"),
                allowNull: false,
            },
            coverImage: {
                type: DataTypes.STRING,
            },
            faqs: {
                type: DataTypes.TEXT,
            },
            status: {
                type: DataTypes.ENUM("draft", "published"),
                defaultValue: "draft",
            },
            publishedAt: {
                type: DataTypes.DATE,
            },
            authorId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
        },
        {
            tableName: "BlogPosts",
        }
    );

    return BlogPost;
};
