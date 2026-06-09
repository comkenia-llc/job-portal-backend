"use strict";

/**
 * Import neighborhood affordability fields from CSV.
 *
 * Usage:
 *   node src/scripts/importNeighborhoodAffordability.js /path/to/file.csv
 *
 * Optional:
 *   DRY_RUN=1 node src/scripts/importNeighborhoodAffordability.js file.csv
 */

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { Location } = require("../models");

const inputPath =
    process.argv[2] ||
    path.resolve(__dirname, "../data/neighborhood-affordability.csv");

const parseCsvLine = (line) => {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }
        if (char === "," && !inQuotes) {
            result.push(current);
            current = "";
            continue;
        }
        current += char;
    }
    result.push(current);
    return result.map((value) => value.trim());
};

const toNumberOrNull = (value) => {
    if (!value) return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
};

async function run() {
    if (!fs.existsSync(inputPath)) {
        throw new Error(`CSV not found at ${inputPath}`);
    }

    const raw = fs.readFileSync(inputPath, "utf8");
    const lines = raw.split(/\r?\n/).filter(Boolean);
    if (lines.length <= 1) {
        throw new Error("CSV appears empty.");
    }

    const headers = parseCsvLine(lines[0]);
    const slugIdx = headers.indexOf("slug");
    const tierIdx = headers.indexOf("affordabilityTier");
    const rentIdx = headers.indexOf("rentMultiplier");

    if (slugIdx === -1) {
        throw new Error("CSV missing required column: slug");
    }

    const dryRun = String(process.env.DRY_RUN || "").toLowerCase() === "1";
    let updated = 0;
    let missing = 0;

    for (let i = 1; i < lines.length; i += 1) {
        const row = parseCsvLine(lines[i]);
        const slug = row[slugIdx];
        if (!slug) continue;

        const affordabilityTier =
            tierIdx !== -1 ? row[tierIdx] || null : null;
        const rentMultiplier =
            rentIdx !== -1 ? toNumberOrNull(row[rentIdx]) : null;

        const location = await Location.findOne({ where: { slug } });
        if (!location) {
            missing += 1;
            continue;
        }

        if (dryRun) {
            updated += 1;
            continue;
        }

        await location.update({
            affordabilityTier,
            rentMultiplier,
        });
        updated += 1;
    }

    console.log(
        `✅ Import complete. Updated: ${updated}. Missing slugs: ${missing}. Dry run: ${dryRun}.`
    );
}

run()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("❌ Import failed:", err);
        process.exit(1);
    });
