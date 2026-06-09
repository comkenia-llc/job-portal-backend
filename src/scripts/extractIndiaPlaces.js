"use strict";

/**
 * Extract India administrative boundaries and place records from an OSM PBF.
 *
 * Usage:
 *   node src/scripts/extractIndiaPlaces.js
 *
 * Expected input:
 *   src/data/india-latest.osm.pbf
 *
 * Output:
 *   src/data/india-places.geojsonseq
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const INPUT_PATH = path.resolve(__dirname, "../data/india-latest.osm.pbf");
const FILTERED_PATH = path.resolve(
    __dirname,
    "../data/india-places-filtered.osm.pbf"
);
const OUTPUT_PATH = path.resolve(__dirname, "../data/india-places.geojsonseq");

const OSMIUM_BIN = process.env.OSMIUM_BIN || "osmium";

const ensureFile = (filePath) => {
    if (!fs.existsSync(filePath)) {
        throw new Error(
            `Missing India OSM extract at ${filePath}. Download the PBF there first.`
        );
    }
};

const run = (bin, args) => {
    console.log(`▶ ${bin} ${args.join(" ")}`);
    execFileSync(bin, args, { stdio: "inherit" });
};

const main = () => {
    ensureFile(INPUT_PATH);

    run(OSMIUM_BIN, [
        "tags-filter",
        INPUT_PATH,
        "r/boundary=administrative",
        "n/place=city,town,village,hamlet,suburb,neighbourhood,neighborhood,quarter",
        "w/place=city,town,village,hamlet,suburb,neighbourhood,neighborhood,quarter",
        "r/place=city,town,village,hamlet,suburb,neighbourhood,neighborhood,quarter",
        "-o",
        FILTERED_PATH,
        "--overwrite",
    ]);

    run(OSMIUM_BIN, [
        "export",
        FILTERED_PATH,
        "-f",
        "geojsonseq",
        "-o",
        OUTPUT_PATH,
        "--overwrite",
    ]);

    console.log(
        `✅ India places GeoJSON written to ${path.relative(process.cwd(), OUTPUT_PATH)}`
    );
};

main();
