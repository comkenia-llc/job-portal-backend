"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn("plans", "ribbon_text", {
            type: Sequelize.STRING(120),
            allowNull: true,
            defaultValue: null,
            after: "description",
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn("plans", "ribbon_text");
    },
};
