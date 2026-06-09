"use strict";

/**
 * Build a hierarchical UK locations JSON from the exported OSM GeoJSON.
 * Usage: node src/scripts/buildUkLocations.js
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const turf = require("@turf/turf");

const SOURCE_PATH = path.resolve(__dirname, "../data/uk-places.geojsonseq");
const OUTPUT_PATH = path.resolve(__dirname, "../data/uk-hierarchy.json");

const NATION_DEFS = [
    { name: "England", aliases: ["england"] },
    { name: "Scotland", aliases: ["scotland"] },
    { name: "Wales", aliases: ["wales", "cymru"] },
    { name: "Northern Ireland", aliases: ["northern ireland"] },
];

const CITY_PLACES = new Set(["city", "town", "village", "hamlet"]);
const NEIGHBORHOOD_PLACES = new Set([
    "suburb",
    "neighbourhood",
    "neighborhood",
    "quarter",
]);

const slugify = (value = "") =>
    value
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");

const normalize = (value = "") =>
    slugify(value)
        .replace(/-/g, " ")
        .trim();

const ensureSource = () => {
    if (!fs.existsSync(SOURCE_PATH)) {
        console.error(`❌ Missing GeoJSON source at ${SOURCE_PATH}`);
        process.exit(1);
    }
};

const parseFeatureLine = (line = "") => {
    const trimmed = String(line).trim();
    if (!trimmed) return null;
    const normalized = trimmed.charCodeAt(0) === 0x1e ? trimmed.slice(1) : trimmed;
    if (!normalized) return null;
    return JSON.parse(normalized);
};

const eachFeature = async (callback) => {
    const stream = fs.createReadStream(SOURCE_PATH, { encoding: "utf8" });
    const rl = readline.createInterface({
        input: stream,
        crlfDelay: Infinity,
    });

    for await (const line of rl) {
        const feature = parseFeatureLine(line);
        if (!feature) continue;
        await callback(feature);
    }
};

const getName = (props = {}) =>
    props["name:en"] ||
    props.name ||
    props["official_name:en"] ||
    props["official_name"];

const getCentroidCoords = (feature) => {
    try {
        const centroid = turf.centroid(feature);
        const [lng, lat] = centroid.geometry.coordinates;
        return { lat, lng };
    } catch {
        return { lat: null, lng: null };
    }
};

const matchNation = (value) => {
    if (!value) return null;
    const clean = normalize(value);
    return (
        NATION_DEFS.find((nation) =>
            nation.aliases.some((alias) => clean.includes(alias))
        ) || null
    );
};

const detectNation = (props, point, nationPolygons, hintName) => {
    const sourceFields = [
        props["is_in:state"],
        props["addr:state"],
        props.state,
        props["is_in:province"],
        props["addr:province"],
        props["is_in:region"],
        props["addr:region"],
        props["is_in"],
    ];

    for (const val of sourceFields) {
        const match = matchNation(val);
        if (match) return match.name;
    }

    if (point && nationPolygons.length) {
        for (const nation of nationPolygons) {
            if (!nation.geometry) continue;
            try {
                if (turf.booleanPointInPolygon(point, nation.geometry)) {
                    return nation.name;
                }
            } catch {
                // ignore invalid geometry
            }
        }
    }

    const hint = matchNation(hintName);
    return hint?.name || null;
};

const detectCityName = (props) => {
    const candidates = [
        props["is_in:city"],
        props["addr:city"],
        props.city,
        props["is_in:town"],
        props["is_in:suburb"],
        props["is_in:neighbourhood"],
    ];
    return candidates.find(Boolean) || null;
};

const booleanPoint = (feature) => {
    try {
        if (feature.geometry?.type === "Point") {
            return turf.point(feature.geometry.coordinates);
        }
        return turf.centroid(feature);
    } catch {
        return null;
    }
};

const buildHierarchy = async () => {
    ensureSource();
    const nationFeatures = [];
    const cityFeatures = [];
    const neighborhoodFeatures = [];

    await eachFeature(async (feature) => {
        const props = feature.properties || {};
        const name = getName(props);
        if (!name) return;

        const boundary = (props.boundary || "").toLowerCase();
        const adminLevel = props.admin_level
            ? parseInt(props.admin_level, 10)
            : null;
        const place = (props.place || "").toLowerCase();

        if (
            boundary === "administrative" &&
            (adminLevel === 4 || adminLevel === 5) &&
            NATION_DEFS.some((nation) => normalize(nation.name) === normalize(name))
        ) {
            nationFeatures.push({ feature, props, name });
            return;
        }

        if (
            CITY_PLACES.has(place) ||
            (boundary === "administrative" && adminLevel && adminLevel <= 8)
        ) {
            cityFeatures.push({ feature, props, name });
            return;
        }

        if (
            NEIGHBORHOOD_PLACES.has(place) ||
            (boundary === "administrative" && adminLevel && adminLevel >= 9)
        ) {
            neighborhoodFeatures.push({ feature, props, name });
        }
    });

    const nationMap = new Map();
    const nationPolygons = [];

    for (const def of NATION_DEFS) {
        const match = nationFeatures.find(
            ({ name }) => normalize(name) === normalize(def.name)
        );
        const geometry = match?.feature?.geometry || null;
        const centroid = geometry
            ? getCentroidCoords(match.feature)
            : { lat: null, lng: null };
        const slug = `uk-${slugify(def.name)}`;
        const nationData = {
            name: def.name,
            slug,
            lat: centroid.lat,
            lng: centroid.lng,
            geometry: match?.feature || null,
            cities: [],
        };
        nationMap.set(def.name, nationData);
        if (geometry && geometry.type && geometry.type !== "Point") {
            nationPolygons.push({ name: def.name, geometry: match.feature });
        }
    }

    const cityMap = new Map();
    const normalizeCityLookup = new Map();

    for (const { feature, props, name } of cityFeatures) {
        const point = booleanPoint(feature);
        const nationName = detectNation(props, point, nationPolygons, name);
        if (!nationName || !nationMap.has(nationName)) continue;

        const coords = getCentroidCoords(feature);
        const nationSlug = nationMap.get(nationName).slug;
        const slug = `${nationSlug}--${slugify(name)}`;
        const key = `${nationSlug}::${normalize(name)}`;
        if (cityMap.has(key)) continue;

        const cityData = {
            name,
            slug,
            lat: coords.lat,
            lng: coords.lng,
            nationSlug,
            neighborhoods: [],
            point,
        };
        cityMap.set(key, cityData);
        normalizeCityLookup.set(key, key);
        nationMap.get(nationName).cities.push(cityData);
    }

    const findNearestCity = (point, nationSlug) => {
        if (!point) return null;
        let best = null;
        for (const city of cityMap.values()) {
            if (nationSlug && city.nationSlug !== nationSlug) continue;
            if (!city.point) continue;
            try {
                const dist = turf.distance(point, city.point, {
                    units: "kilometers",
                });
                if (!best || dist < best.dist) {
                    best = { city, dist };
                }
            } catch {
                // ignore invalid geometry
            }
        }
        return best?.city || null;
    };

    let skippedNeighborhoods = 0;

    for (const { feature, props, name } of neighborhoodFeatures) {
        const point = booleanPoint(feature);
        const nationName = detectNation(props, point, nationPolygons, name);
        const nationSlug =
            nationName && nationMap.has(nationName)
                ? nationMap.get(nationName).slug
                : null;

        let city = null;
        const cityNameCandidate = detectCityName(props);
        if (cityNameCandidate && nationSlug) {
            city =
                cityMap.get(`${nationSlug}::${normalize(cityNameCandidate)}`) || null;
        }

        if (!city && nationSlug) {
            city = findNearestCity(point, nationSlug);
        }

        if (!city) {
            city = findNearestCity(point, null);
        }

        if (!city) {
            skippedNeighborhoods++;
            continue;
        }

        const coords = getCentroidCoords(feature);
        city.neighborhoods.push({
            name,
            slug: `${city.slug}--${slugify(name)}`,
            lat: coords.lat,
            lng: coords.lng,
        });
    }

    const states = Array.from(nationMap.values()).map((nation) => ({
        name: nation.name,
        slug: nation.slug,
        lat: nation.lat,
        lng: nation.lng,
        cities: nation.cities
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((city) => ({
                name: city.name,
                slug: city.slug,
                lat: city.lat,
                lng: city.lng,
                neighborhoods: city.neighborhoods.sort((a, b) =>
                    a.name.localeCompare(b.name)
                ),
            })),
    }));

    const output = {
        generatedAt: new Date().toISOString(),
        source: path.relative(process.cwd(), SOURCE_PATH),
        country: {
            name: "United Kingdom",
            code: "GB",
            slug: "uk",
            lat: 55.3781,
            lng: -3.436,
        },
        states,
        stats: {
            stateCount: states.length,
            cityCount: Array.from(cityMap.values()).length,
            neighborhoodCount: states.reduce(
                (sum, state) =>
                    sum +
                    state.cities.reduce(
                        (citySum, city) => citySum + city.neighborhoods.length,
                        0
                    ),
                0
            ),
            skippedNeighborhoods,
        },
    };

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
    console.log(
        `✅ UK hierarchy written to ${path.relative(process.cwd(), OUTPUT_PATH)}`
    );
    console.log(
        `   States: ${output.stats.stateCount}, Cities: ${output.stats.cityCount}, Neighborhoods: ${output.stats.neighborhoodCount}, Skipped neighborhoods: ${output.stats.skippedNeighborhoods}`
    );
};

buildHierarchy().catch((err) => {
    console.error("❌ Failed to build UK hierarchy:", err);
    process.exit(1);
});
