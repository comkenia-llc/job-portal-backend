"use strict";

/**
 * Extract Saudi Arabia administrative boundaries and place records from an OSM PBF.
 *
 * Usage:
 *   node src/scripts/extractSaudiPlaces.js
 *
 * Expected input:
 *   src/data/gcc-states-latest.osm.pbf
 *
 * Output:
 *   src/data/saudi-places.geojsonseq
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const INPUT_PATH = path.resolve(
    __dirname,
    "../data/gcc-states-latest.osm.pbf"
);
const FILTERED_PATH = path.resolve(
    __dirname,
    "../data/saudi-places-filtered.osm.pbf"
);
const OUTPUT_PATH = path.resolve(__dirname, "../data/saudi-places.geojsonseq");

const OSMIUM_BIN = process.env.OSMIUM_BIN || "osmium";

const ensureFile = (filePath) => {
    if (!fs.existsSync(filePath)) {
        throw new Error(
            `Missing GCC OSM extract at ${filePath}. Put gcc-states-latest.osm.pbf there first.`
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
        `✅ Saudi Arabia places GeoJSON written to ${path.relative(process.cwd(), OUTPUT_PATH)}`
    );
};

main();
