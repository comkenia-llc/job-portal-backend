"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn("locations", "affordabilityTier", {
            type: Sequelize.STRING,
            allowNull: true,
        });
        await queryInterface.addColumn("locations", "rentMultiplier", {
            type: Sequelize.DECIMAL(5, 2),
            allowNull: true,
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn("locations", "affordabilityTier");
        await queryInterface.removeColumn("locations", "rentMultiplier");
    },
};
