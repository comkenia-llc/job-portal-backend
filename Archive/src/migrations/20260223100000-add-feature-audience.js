"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn("features", "audience", {
            type: Sequelize.ENUM("employer", "candidate"),
            allowNull: false,
            defaultValue: "employer",
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn("features", "audience");
    },
};
