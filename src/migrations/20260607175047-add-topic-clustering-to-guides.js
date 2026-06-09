"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn("Guides", "topicKey", {
            type: Sequelize.STRING,
            allowNull: true,
        });

        await queryInterface.addColumn("Guides", "parentGuideId", {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: "Guides",
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "SET NULL",
        });

        await queryInterface.addColumn("Guides", "clusterRole", {
            type: Sequelize.ENUM("pillar", "supporting", "faq", "comparison"),
            allowNull: true,
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn("Guides", "topicKey");
        await queryInterface.removeColumn("Guides", "parentGuideId");
        await queryInterface.removeColumn("Guides", "clusterRole");
    },
};