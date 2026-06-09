"use strict";

/**
 * Backfill legacy Dubai records from market="global" to market="dubai".
 *
 * Usage:
 *   node src/scripts/backfillLegacyDubaiMarket.js
 *
 * Dry run:
 *   DRY_RUN=true node src/scripts/backfillLegacyDubaiMarket.js
 */

require("dotenv").config();

const {
    sequelize,
    Location,
    Company,
    Job,
    GlobalSetting,
    BlogPost,
    Guide,
    User,
} = require("../models");

const LEGACY_MARKET = "global";
const TARGET_MARKET = "dubai";
const DRY_RUN =
    String(process.env.DRY_RUN || "false").trim().toLowerCase() === "true";

const TABLES = [
    { label: "Locations", model: Location, field: "market" },
    { label: "Companies", model: Company, field: "market" },
    { label: "Jobs", model: Job, field: "market" },
    { label: "GlobalSettings", model: GlobalSetting, field: "market" },
    { label: "BlogPosts", model: BlogPost, field: "market" },
    { label: "Guides", model: Guide, field: "market" },
    { label: "Users.preferredMarket", model: User, field: "preferredMarket" },
];

async function summarizeRow(label, model, field, transaction) {
    const [legacyCount, targetCount] = await Promise.all([
        model.count({ where: { [field]: LEGACY_MARKET }, transaction }),
        model.count({ where: { [field]: TARGET_MARKET }, transaction }),
    ]);

    return { label, field, legacyCount, targetCount };
}

async function run() {
    console.log(
        `${DRY_RUN ? "🧪 Dry run" : "🚚 Backfill"}: moving legacy ${LEGACY_MARKET} data to ${TARGET_MARKET}`
    );

    await sequelize.transaction(async (transaction) => {
        const before = [];
        for (const entry of TABLES) {
            before.push(
                await summarizeRow(
                    entry.label,
                    entry.model,
                    entry.field,
                    transaction
                )
            );
        }

        console.table(
            before.map((item) => ({
                table: item.label,
                legacyGlobal: item.legacyCount,
                existingDubai: item.targetCount,
            }))
        );

        if (DRY_RUN) {
            console.log("ℹ️ No changes applied because DRY_RUN=true");
            throw new Error("__ROLLBACK_DRY_RUN__");
        }

        for (const entry of TABLES) {
            const [affected] = await entry.model.update(
                { [entry.field]: TARGET_MARKET },
                {
                    where: { [entry.field]: LEGACY_MARKET },
                    transaction,
                }
            );
            console.log(`✅ ${entry.label}: updated ${affected} rows`);
        }

        const after = [];
        for (const entry of TABLES) {
            after.push(
                await summarizeRow(
                    entry.label,
                    entry.model,
                    entry.field,
                    transaction
                )
            );
        }

        console.table(
            after.map((item) => ({
                table: item.label,
                legacyGlobal: item.legacyCount,
                dubai: item.targetCount,
            }))
        );
    }).catch((err) => {
        if (err.message === "__ROLLBACK_DRY_RUN__") {
            return;
        }
        throw err;
    });
}

run()
    .catch((err) => {
        console.error("❌ Legacy Dubai backfill failed:", err);
        process.exitCode = 1;
    })
    .finally(async () => {
        try {
            await sequelize.close();
        } catch {
            // ignore close errors
        }
    });
