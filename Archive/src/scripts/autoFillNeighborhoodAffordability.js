"use strict";

/**
 * Auto-fill affordabilityTier and rentMultiplier in neighborhood CSV
 * using keyword rules.
 *
 * Usage:
 *   node src/scripts/autoFillNeighborhoodAffordability.js
 *   node src/scripts/autoFillNeighborhoodAffordability.js /path/to/file.csv
 */

const fs = require("fs");
const path = require("path");

const inputPath =
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
    return result;
};

const normalize = (value) => (value || "").toLowerCase();

const PREMIUM_KEYWORDS = [
    "palm",
    "jumeirah",
    "marina",
    "downtown",
    "jbr",
    "creek",
    "island",
    "golf",
    "hills",
    "ranches",
    "business bay",
    "city walk",
    "emirates hills",
];

const BUDGET_KEYWORDS = [
    "industrial",
    "labor",
    "labour",
    "camp",
    "workers",
    "village",
    "outskirts",
    "old town",
    "south",
    "northern district",
];

const pickTier = (name, city, state) => {
    const haystack = `${name} ${city} ${state}`.toLowerCase();
    if (PREMIUM_KEYWORDS.some((k) => haystack.includes(k))) return "premium";
    if (BUDGET_KEYWORDS.some((k) => haystack.includes(k))) return "budget";
    return "mid";
};

const pickMultiplier = (tier, name) => {
    const label = normalize(name);
    if (tier === "premium") {
        if (label.includes("palm")) return 12.5;
        if (label.includes("emirates hills")) return 8;
        if (label.includes("island")) return 6;
        if (label.includes("marina") || label.includes("jbr")) return 5.5;
        if (label.includes("jumeirah")) return 5;
        if (label.includes("downtown") || label.includes("creek")) return 5;
        return 4;
    }
    if (tier === "mid") return 2.5;
    return 1.3;
};

function run() {
    if (!fs.existsSync(inputPath)) {
        throw new Error(`CSV not found at ${inputPath}`);
    }
    const raw = fs.readFileSync(inputPath, "utf8");
    const lines = raw.split(/\r?\n/).filter((line) => line.length > 0);
    if (lines.length <= 1) {
        throw new Error("CSV appears empty.");
    }

    const headers = parseCsvLine(lines[0]);
    const idx = {
        slug: headers.indexOf("slug"),
        name: headers.indexOf("name"),
        city: headers.indexOf("city"),
        state: headers.indexOf("state"),
        tier: headers.indexOf("affordabilityTier"),
        multiplier: headers.indexOf("rentMultiplier"),
    };

    if (idx.name === -1 || idx.tier === -1 || idx.multiplier === -1) {
        throw new Error("CSV missing required columns.");
    }

    const output = [lines[0]];
    let updated = 0;

    for (let i = 1; i < lines.length; i += 1) {
        const row = parseCsvLine(lines[i]);
        const name = row[idx.name] || "";
        const city = row[idx.city] || "";
        const state = row[idx.state] || "";
        const tier = pickTier(name, city, state);
        const multiplier = pickMultiplier(tier, name);

        row[idx.tier] = tier;
        row[idx.multiplier] = String(multiplier);
        updated += 1;

        output.push(row.map(csvEscape).join(","));
    }

    fs.writeFileSync(inputPath, output.join("\n"), "utf8");
    console.log(`✅ Auto-filled ${updated} rows in ${inputPath}`);
}

try {
    run();
} catch (err) {
    console.error("❌ Auto-fill failed:", err.message);
    process.exit(1);
}
