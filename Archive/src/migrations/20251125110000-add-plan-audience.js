"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn("plans", "audience", {
            type: Sequelize.ENUM("employer", "candidate"),
            allowNull: false,
            defaultValue: "employer",
            after: "slug",
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn("plans", "audience");
    },
};
