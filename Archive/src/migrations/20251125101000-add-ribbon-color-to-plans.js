"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn("plans", "ribbon_color", {
            type: Sequelize.STRING(30),
            allowNull: true,
            defaultValue: null,
            after: "ribbon_text",
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn("plans", "ribbon_color");
    },
};
