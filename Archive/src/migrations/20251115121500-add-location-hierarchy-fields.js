"use strict";

const TABLE = "Locations";

const slugify = (value = "") =>
    value
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");

module.exports = {
    async up(queryInterface, Sequelize) {
        const tableDefinition = await queryInterface.describeTable(TABLE);
        const addColumnIfMissing = async (column, definition) => {
            if (!tableDefinition[column]) {
                await queryInterface.addColumn(TABLE, column, definition);
            }
        };

        await addColumnIfMissing("country", { type: Sequelize.STRING, allowNull: true });
        await addColumnIfMissing("countryCode", { type: Sequelize.STRING, allowNull: true });
        await addColumnIfMissing("state", { type: Sequelize.STRING, allowNull: true });
        await addColumnIfMissing("city", { type: Sequelize.STRING, allowNull: true });
        await addColumnIfMissing("continent", { type: Sequelize.STRING, allowNull: true });
        await addColumnIfMissing("timezone", { type: Sequelize.STRING, allowNull: true });
        await addColumnIfMissing("currency", {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: "USD",
        });
        await addColumnIfMissing("slug", {
            type: Sequelize.STRING,
            allowNull: true,
        });

        // Ensure every row has a slug
        const [rows] = await queryInterface.sequelize.query(
            `SELECT id, slug, city, state, country, name FROM \`${TABLE}\``
        );
        const existingSlugs = new Set(
            rows
                .map((row) => row.slug)
                .filter((slug) => typeof slug === "string" && slug.trim().length > 0)
        );
        for (const row of rows) {
            if (row.slug && row.slug.trim().length > 0) continue;
            const base =
                slugify([row.city, row.state, row.country].filter(Boolean).join("-")) ||
                slugify(row.name || "") ||
                `location-${row.id}`;
            let candidate = base || `location-${row.id}`;
            let counter = 1;
            while (existingSlugs.has(candidate)) {
                candidate = `${base}-${counter++}`;
            }
            existingSlugs.add(candidate);
            await queryInterface.sequelize.query(
                `UPDATE \`${TABLE}\` SET slug = :slug WHERE id = :id`,
                { replacements: { slug: candidate, id: row.id } }
            );
        }

        await queryInterface.changeColumn(TABLE, "slug", {
            type: Sequelize.STRING,
            allowNull: false,
        });

        const indexes = await queryInterface.showIndex(TABLE);
        const slugIndexExists = indexes.some((index) => index.name === "locations_slug_unique");
        if (!slugIndexExists) {
            await queryInterface.addIndex(TABLE, ["slug"], {
                name: "locations_slug_unique",
                unique: true,
            });
        }
    },

    async down(queryInterface) {
        await queryInterface.removeIndex(TABLE, "locations_slug_unique").catch(() => {});
        const tableDefinition = await queryInterface.describeTable(TABLE);
        const removeColumnIfExists = async (column) => {
            if (tableDefinition[column]) {
                await queryInterface.removeColumn(TABLE, column);
            }
        };

        await removeColumnIfExists("country");
        await removeColumnIfExists("countryCode");
        await removeColumnIfExists("state");
        await removeColumnIfExists("city");
        await removeColumnIfExists("continent");
        await removeColumnIfExists("timezone");
        await removeColumnIfExists("slug");
        // Currency column was originally required; keep it if already used.
    },
};
