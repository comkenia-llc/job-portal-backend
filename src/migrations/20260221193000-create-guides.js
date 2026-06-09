"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("Guides", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            type: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            slug: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true,
            },
            title: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            summary: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            content: {
                type: Sequelize.TEXT("long"),
                allowNull: true,
            },
            payload: {
                type: Sequelize.TEXT("long"),
                allowNull: true,
            },
            faqs: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            tags: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            coverImage: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            readingMinutes: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            status: {
                type: Sequelize.ENUM("draft", "published"),
                defaultValue: "draft",
            },
            publishedAt: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            seoTitle: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            seoDescription: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            seoKeywords: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            canonicalUrl: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            metaImage: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            schemaType: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            authorId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "Users",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
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
    },

    async down(queryInterface) {
        await queryInterface.dropTable("Guides");
    },
};
