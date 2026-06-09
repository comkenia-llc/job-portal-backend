"use strict";

/**
 * Export neighborhoods with affordability fields to CSV.
 *
 * Usage:
 *   node src/scripts/exportNeighborhoodAffordability.js
 *   node src/scripts/exportNeighborhoodAffordability.js /path/to/output.csv
 */

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { Location } = require("../models");

const outputPath =
    process.argv[2] ||
    path.resolve(__dirname, "../data/neighborhood-affordability.csv");

const csvEscape = (value) => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (str.includes('"') || str.includes(",") || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
};

const toNumberOrEmpty = (value) => {
    if (value === null || value === undefined || value === "") return "";
    const num = Number(value);
    return Number.isFinite(num) ? num : "";
};

async function run() {
    const neighborhoods = await Location.findAll({
        where: { type: "neighborhood" },
        order: [
            ["country", "ASC"],
            ["state", "ASC"],
            ["city", "ASC"],
            ["name", "ASC"],
        ],
    });

    const rows = [];
    rows.push(
        [
            "slug",
            "name",
            "city",
            "state",
            "country",
            "affordabilityTier",
            "rentMultiplier",
        ].join(",")
    );

    for (const loc of neighborhoods) {
        rows.push(
            [
                csvEscape(loc.slug),
                csvEscape(loc.name),
                csvEscape(loc.city),
                csvEscape(loc.state),
                csvEscape(loc.country),
                csvEscape(loc.affordabilityTier),
                csvEscape(toNumberOrEmpty(loc.rentMultiplier)),
            ].join(",")
        );
    }

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, rows.join("\n"), "utf8");
    console.log(`✅ Exported ${neighborhoods.length} rows to ${outputPath}`);
}

run()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("❌ Export failed:", err);
        process.exit(1);
    });
