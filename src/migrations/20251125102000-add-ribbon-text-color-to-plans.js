"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn("plans", "ribbon_text_color", {
            type: Sequelize.STRING(30),
            allowNull: true,
            defaultValue: null,
            after: "ribbon_color",
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn("plans", "ribbon_text_color");
    },
};
