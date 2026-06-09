"use strict";

const DEFAULT_MARKET = "global";

async function addColumnIfMissing(queryInterface, tableName, columnName, definition) {
    const table = await queryInterface.describeTable(tableName);
    if (!table[columnName]) {
        await queryInterface.addColumn(tableName, columnName, definition);
    }
}

async function addIndexIfMissing(queryInterface, tableName, fields, options = {}) {
    const indexes = await queryInterface.showIndex(tableName);
    const name = options.name;
    if (name && indexes.some((index) => index.name === name)) {
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

        await addColumnIfMissing(queryInterface, "Jobs", "market", marketColumn);
        await addColumnIfMissing(queryInterface, "Companies", "market", marketColumn);
        await addColumnIfMissing(queryInterface, "locations", "market", marketColumn);
        await addColumnIfMissing(queryInterface, "GlobalSettings", "market", marketColumn);
        await addColumnIfMissing(queryInterface, "BlogPosts", "market", marketColumn);
        await addColumnIfMissing(queryInterface, "Guides", "market", marketColumn);

        await queryInterface.sequelize.query(`UPDATE Jobs SET market = COALESCE(NULLIF(market, ''), '${DEFAULT_MARKET}')`);
        await queryInterface.sequelize.query(`UPDATE Companies SET market = COALESCE(NULLIF(market, ''), '${DEFAULT_MARKET}')`);
        await queryInterface.sequelize.query(`UPDATE locations SET market = COALESCE(NULLIF(market, ''), '${DEFAULT_MARKET}')`);
        await queryInterface.sequelize.query(`UPDATE GlobalSettings SET market = COALESCE(NULLIF(market, ''), '${DEFAULT_MARKET}')`);
        await queryInterface.sequelize.query(`UPDATE BlogPosts SET market = COALESCE(NULLIF(market, ''), '${DEFAULT_MARKET}')`);
        await queryInterface.sequelize.query(`UPDATE Guides SET market = COALESCE(NULLIF(market, ''), '${DEFAULT_MARKET}')`);

        await addIndexIfMissing(queryInterface, "Jobs", ["market"], { name: "jobs_market_idx" });
        await addIndexIfMissing(queryInterface, "Companies", ["market"], { name: "companies_market_idx" });
        await addIndexIfMissing(queryInterface, "locations", ["market"], { name: "locations_market_idx" });
        await addIndexIfMissing(queryInterface, "BlogPosts", ["market"], { name: "blog_posts_market_idx" });
        await addIndexIfMissing(queryInterface, "Guides", ["market"], { name: "guides_market_idx" });
        await addIndexIfMissing(queryInterface, "GlobalSettings", ["market"], {
            name: "global_settings_market_unique_idx",
            unique: true,
        });
    },

    async down(queryInterface) {
        for (const [tableName, indexName] of [
            ["GlobalSettings", "global_settings_market_unique_idx"],
            ["Guides", "guides_market_idx"],
            ["BlogPosts", "blog_posts_market_idx"],
            ["locations", "locations_market_idx"],
            ["Companies", "companies_market_idx"],
            ["Jobs", "jobs_market_idx"],
        ]) {
            try {
                await queryInterface.removeIndex(tableName, indexName);
            } catch (_) {
                // noop
            }
        }

        await queryInterface.removeColumn("Guides", "market");
        await queryInterface.removeColumn("BlogPosts", "market");
        await queryInterface.removeColumn("GlobalSettings", "market");
        await queryInterface.removeColumn("locations", "market");
        await queryInterface.removeColumn("Companies", "market");
        await queryInterface.removeColumn("Jobs", "market");
    },
};
