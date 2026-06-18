"use strict";

const DEFAULT_MARKET = "global";

async function addColumnIfMissing(queryInterface, tableName, columnName, definition) {
    const table = await queryInterface.describeTable(tableName);
    if (!table[columnName]) {
        await queryInterface.addColumn(tableName, columnName, definition);
    }
}

async function removeUniqueIndexForField(queryInterface, tableName, fieldName) {
    const indexes = await queryInterface.showIndex(tableName);
    const candidates = indexes.filter(
        (index) =>
            index.unique &&
            !index.primary &&
            index.fields?.length === 1 &&
            index.fields?.[0]?.attribute === fieldName
    );

    for (const index of candidates) {
        try {
            await queryInterface.removeIndex(tableName, index.name);
        } catch (_) {
            // noop
        }
    }
}

async function addIndexIfMissing(queryInterface, tableName, fields, options = {}) {
    const indexes = await queryInterface.showIndex(tableName);
    if (options.name && indexes.some((index) => index.name === options.name)) {
        return;
    }
    await queryInterface.addIndex(tableName, fields, options);
}

module.exports = {
    async up(queryInterface, Sequelize) {
        const marketColumn = {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: DEFAULT_MARKET,
        };

        await addColumnIfMissing(queryInterface, "plans", "market", marketColumn);
        await addColumnIfMissing(queryInterface, "features", "market", marketColumn);

        await queryInterface.sequelize.query(
            `UPDATE plans SET market = COALESCE(NULLIF(market, ''), '${DEFAULT_MARKET}')`
        );
        await queryInterface.sequelize.query(
            `UPDATE features SET market = COALESCE(NULLIF(market, ''), '${DEFAULT_MARKET}')`
        );

        await removeUniqueIndexForField(queryInterface, "plans", "slug");
        await removeUniqueIndexForField(queryInterface, "features", "key");

        await addIndexIfMissing(queryInterface, "plans", ["market"], {
            name: "plans_market_idx",
        });
        await addIndexIfMissing(queryInterface, "features", ["market"], {
            name: "features_market_idx",
        });
        await addIndexIfMissing(queryInterface, "plans", ["slug", "market"], {
            name: "plans_slug_market_unique_idx",
            unique: true,
        });
        await addIndexIfMissing(queryInterface, "features", ["key", "market"], {
            name: "features_key_market_unique_idx",
            unique: true,
        });
    },

    async down(queryInterface) {
        for (const [tableName, indexName] of [
            ["features", "features_key_market_unique_idx"],
            ["plans", "plans_slug_market_unique_idx"],
            ["features", "features_market_idx"],
            ["plans", "plans_market_idx"],
        ]) {
            try {
                await queryInterface.removeIndex(tableName, indexName);
            } catch (_) {
                // noop
            }
        }

        await queryInterface.removeColumn("features", "market");
        await queryInterface.removeColumn("plans", "market");
    },
};
