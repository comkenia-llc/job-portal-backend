"use strict";

const TABLE = "JobIndustries";
const COMPOSITE_INDEX = "job_industries_market_slug_unique";

async function removeSingleSlugUniqueIndexes(queryInterface) {
    const indexes = await queryInterface.showIndex(TABLE);
    const singleSlugIndexes = indexes.filter((index) => {
        const fields = (index.fields || []).map((field) => field.attribute || field.name);
        return index.unique && fields.length === 1 && fields[0] === "slug";
    });

    for (const index of singleSlugIndexes) {
        await queryInterface.removeIndex(TABLE, index.name).catch(() => {});
    }
}

module.exports = {
    async up(queryInterface) {
        await removeSingleSlugUniqueIndexes(queryInterface);

        const indexes = await queryInterface.showIndex(TABLE);
        const hasComposite = indexes.some((index) => index.name === COMPOSITE_INDEX);

        if (!hasComposite) {
            await queryInterface.addIndex(TABLE, ["market", "slug"], {
                unique: true,
                name: COMPOSITE_INDEX,
            });
        }
    },

    async down(queryInterface) {
        await queryInterface.removeIndex(TABLE, COMPOSITE_INDEX).catch(() => {});
        await queryInterface.addIndex(TABLE, ["slug"], {
            unique: true,
            name: "job_industries_slug_unique",
        });
    },
};
