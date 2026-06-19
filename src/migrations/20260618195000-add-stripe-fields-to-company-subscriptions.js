"use strict";

async function addColumnIfMissing(queryInterface, tableName, columnName, definition) {
    const table = await queryInterface.describeTable(tableName);
    if (!table[columnName]) {
        await queryInterface.addColumn(tableName, columnName, definition);
    }
}

module.exports = {
    async up(queryInterface, Sequelize) {
        await addColumnIfMissing(queryInterface, "company_subscriptions", "stripe_customer_id", {
            type: Sequelize.STRING,
            allowNull: true,
        });
        await addColumnIfMissing(queryInterface, "company_subscriptions", "stripe_subscription_id", {
            type: Sequelize.STRING,
            allowNull: true,
        });
    },

    async down(queryInterface) {
        for (const column of ["stripe_subscription_id", "stripe_customer_id"]) {
            try {
                await queryInterface.removeColumn("company_subscriptions", column);
            } catch (_) {
                // noop
            }
        }
    },
};
