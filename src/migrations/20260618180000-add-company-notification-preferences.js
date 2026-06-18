"use strict";

async function addColumnIfMissing(queryInterface, tableName, columnName, definition) {
    const table = await queryInterface.describeTable(tableName);
    if (!table[columnName]) {
        await queryInterface.addColumn(tableName, columnName, definition);
    }
}

module.exports = {
    async up(queryInterface, Sequelize) {
        await addColumnIfMissing(queryInterface, "Companies", "notificationPreferences", {
            type: Sequelize.JSON,
            allowNull: true,
        });

        await addColumnIfMissing(queryInterface, "Companies", "communicationPreferences", {
            type: Sequelize.JSON,
            allowNull: true,
        });
    },

    async down(queryInterface) {
        try {
            await queryInterface.removeColumn("Companies", "communicationPreferences");
        } catch (_) {
            // noop
        }

        try {
            await queryInterface.removeColumn("Companies", "notificationPreferences");
        } catch (_) {
            // noop
        }
    },
};
