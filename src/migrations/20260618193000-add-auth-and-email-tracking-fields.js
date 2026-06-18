"use strict";

async function addColumnIfMissing(queryInterface, tableName, columnName, definition) {
    const table = await queryInterface.describeTable(tableName);
    if (!table[columnName]) {
        await queryInterface.addColumn(tableName, columnName, definition);
    }
}

module.exports = {
    async up(queryInterface, Sequelize) {
        await addColumnIfMissing(queryInterface, "Users", "passwordResetTokenHash", {
            type: Sequelize.STRING,
            allowNull: true,
        });
        await addColumnIfMissing(queryInterface, "Users", "passwordResetExpiresAt", {
            type: Sequelize.DATE,
            allowNull: true,
        });
        await addColumnIfMissing(queryInterface, "Jobs", "expiringSoonEmailSentAt", {
            type: Sequelize.DATE,
            allowNull: true,
        });
        await addColumnIfMissing(queryInterface, "Jobs", "expiredEmailSentAt", {
            type: Sequelize.DATE,
            allowNull: true,
        });
        await addColumnIfMissing(queryInterface, "SavedJobs", "reminderSentAt", {
            type: Sequelize.DATE,
            allowNull: true,
        });
    },

    async down(queryInterface) {
        for (const [table, column] of [
            ["SavedJobs", "reminderSentAt"],
            ["Jobs", "expiredEmailSentAt"],
            ["Jobs", "expiringSoonEmailSentAt"],
            ["Users", "passwordResetExpiresAt"],
            ["Users", "passwordResetTokenHash"],
        ]) {
            try {
                await queryInterface.removeColumn(table, column);
            } catch (_) {
                // noop
            }
        }
    },
};
