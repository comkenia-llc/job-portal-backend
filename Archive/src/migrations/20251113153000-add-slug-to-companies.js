"use strict";

const tableName = "Companies";

const slugify = (value = "") =>
    value
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 90);

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.sequelize.transaction(async (transaction) => {
            const tableDefinition = await queryInterface.describeTable(tableName);

            if (!tableDefinition.slug) {
                await queryInterface.addColumn(
                    tableName,
                    "slug",
                    {
                        type: Sequelize.STRING,
                        allowNull: true,
                    },
                    { transaction }
                );
            }

            const [companies] = await queryInterface.sequelize.query(
                `SELECT id, name FROM \`${tableName}\` ORDER BY id ASC`,
                { transaction }
            );

            const used = new Set();

            for (const company of companies) {
                let base = slugify(company.name) || `company-${company.id}`;
                let slug = base;
                let counter = 1;

                while (used.has(slug)) {
                    slug = `${base}-${counter++}`;
                }
                used.add(slug);

                await queryInterface.sequelize.query(
                    `UPDATE \`${tableName}\` SET slug = :slug WHERE id = :id`,
                    {
                        replacements: { slug, id: company.id },
                        transaction,
                    }
                );
            }

            if (!tableDefinition.slug || tableDefinition.slug.allowNull || !tableDefinition.slug.unique) {
                await queryInterface.changeColumn(
                    tableName,
                    "slug",
                    {
                        type: Sequelize.STRING,
                        allowNull: false,
                        unique: true,
                    },
                    { transaction }
                );
            }
        });
    },

    async down(queryInterface) {
        const tableDefinition = await queryInterface.describeTable(tableName);
        if (tableDefinition.slug) {
            await queryInterface.removeColumn(tableName, "slug");
        }
    },
};
