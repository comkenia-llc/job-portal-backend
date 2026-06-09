"use strict";

/**
 * Build a hierarchical Germany locations JSON from the exported OSM GeoJSON sequence.
 * Usage: node src/scripts/buildGermanyLocations.js
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const turf = require("@turf/turf");

const SOURCE_PATH = path.resolve(__dirname, "../data/germany-places.geojsonseq");
const OUTPUT_PATH = path.resolve(__dirname, "../data/germany-hierarchy.json");

const STATE_DEFS = [
    { name: "Baden-Württemberg", aliases: ["baden württemberg", "baden-wuerttemberg", "baden württemberg"] },
    { name: "Bavaria", aliases: ["bayern", "bavaria", "freistaat bayern"] },
    { name: "Berlin", aliases: ["berlin"] },
    { name: "Brandenburg", aliases: ["brandenburg"] },
    { name: "Bremen", aliases: ["bremen", "fre hansestadt bremen"] },
    { name: "Hamburg", aliases: ["hamburg", "freie und hansestadt hamburg"] },
    { name: "Hesse", aliases: ["hessen", "hesse"] },
    { name: "Lower Saxony", aliases: ["niedersachsen", "lower saxony"] },
    { name: "Mecklenburg-Vorpommern", aliases: ["mecklenburg vorpommern", "mecklenburg-vorpommern"] },
    { name: "North Rhine-Westphalia", aliases: ["nordrhein westfalen", "north rhine-westphalia", "nrw"] },
    { name: "Rhineland-Palatinate", aliases: ["rheinland pfalz", "rhineland-palatinate"] },
    { name: "Saarland", aliases: ["saarland"] },
    { name: "Saxony", aliases: ["sachsen", "saxony"] },
    { name: "Saxony-Anhalt", aliases: ["sachsen anhalt", "saxony-anhalt"] },
    { name: "Schleswig-Holstein", aliases: ["schleswig holstein", "schleswig-holstein"] },
    { name: "Thuringia", aliases: ["thüringen", "thuringia", "thueringen"] },
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

const matchState = (value) => {
    if (!value) return null;
    const clean = normalize(value);
    return (
        STATE_DEFS.find((state) =>
            state.aliases.some((alias) => clean.includes(alias))
        ) || null
    );
};

const detectState = (props, point, statePolygons, hintName) => {
    const sourceFields = [
        props["is_in:state"],
        props["addr:state"],
        props.state,
        props["is_in:province"],
        props["addr:province"],
        props.province,
        props["is_in:region"],
        props["addr:region"],
        props["is_in"],
    ];

    for (const val of sourceFields) {
        const match = matchState(val);
        if (match) return match.name;
    }

    if (point && statePolygons.length) {
        for (const state of statePolygons) {
            if (!state.geometry) continue;
            try {
                if (turf.booleanPointInPolygon(point, state.geometry)) {
                    return state.name;
                }
            } catch {
                // ignore invalid geometry
            }
        }
    }

    const hint = matchState(hintName);
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
    const stateFeatures = [];
    const cityFeatures = [];
    const neighborhoodFeatures = [];

    await eachFeature(async (feature) => {
        const props = feature.properties || {};
        const name = getName(props);
        if (!name) return;

        const boundary = (props.boundary || "").toLowerCase();
        const adminLevel = props.admin_level ? parseInt(props.admin_level, 10) : null;
        const place = (props.place || "").toLowerCase();

        if (
            boundary === "administrative" &&
            (adminLevel === 4 || adminLevel === 5) &&
            STATE_DEFS.some((state) => normalize(state.name) === normalize(name))
        ) {
            stateFeatures.push({ feature, props, name });
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

    const stateMap = new Map();
    const statePolygons = [];

    for (const def of STATE_DEFS) {
        const match = stateFeatures.find(
            ({ name }) => normalize(name) === normalize(def.name)
        );
        const geometry = match?.feature?.geometry || null;
        const centroid = geometry
            ? getCentroidCoords(match.feature)
            : { lat: null, lng: null };
        const slug = `germany-${slugify(def.name)}`;
        const stateData = {
            name: def.name,
            slug,
            lat: centroid.lat,
            lng: centroid.lng,
            geometry: match?.feature || null,
            cities: [],
        };
        stateMap.set(def.name, stateData);
        if (geometry && geometry.type && geometry.type !== "Point") {
            statePolygons.push({ name: def.name, geometry: match.feature });
        }
    }

    const cityMap = new Map();

    for (const { feature, props, name } of cityFeatures) {
        const point = booleanPoint(feature);
        const stateName = detectState(props, point, statePolygons, name);
        if (!stateName || !stateMap.has(stateName)) continue;

        const coords = getCentroidCoords(feature);
        const stateSlug = stateMap.get(stateName).slug;
        const slug = `${stateSlug}--${slugify(name)}`;
        const key = `${stateSlug}::${normalize(name)}`;
        if (cityMap.has(key)) continue;

        const cityData = {
            name,
            slug,
            lat: coords.lat,
            lng: coords.lng,
            stateSlug,
            neighborhoods: [],
            point,
        };
        cityMap.set(key, cityData);
        stateMap.get(stateName).cities.push(cityData);
    }

    const findNearestCity = (point, stateSlug) => {
        if (!point) return null;
        let best = null;
        for (const city of cityMap.values()) {
            if (stateSlug && city.stateSlug !== stateSlug) continue;
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
        const stateName = detectState(props, point, statePolygons, name);
        const stateSlug =
            stateName && stateMap.has(stateName)
                ? stateMap.get(stateName).slug
                : null;

        let city = null;
        const cityNameCandidate = detectCityName(props);
        if (cityNameCandidate && stateSlug) {
            city = cityMap.get(`${stateSlug}::${normalize(cityNameCandidate)}`) || null;
        }

        if (!city && stateSlug) {
            city = findNearestCity(point, stateSlug);
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

    const states = Array.from(stateMap.values()).map((state) => ({
        name: state.name,
        slug: state.slug,
        lat: state.lat,
        lng: state.lng,
        cities: state.cities
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
            name: "Germany",
            code: "DE",
            slug: "germany",
            lat: 51.1657,
            lng: 10.4515,
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
        `✅ Germany hierarchy written to ${path.relative(process.cwd(), OUTPUT_PATH)}`
    );
    console.log(
        `   States: ${output.stats.stateCount}, Cities: ${output.stats.cityCount}, Neighborhoods: ${output.stats.neighborhoodCount}, Skipped neighborhoods: ${output.stats.skippedNeighborhoods}`
    );
};

buildHierarchy().catch((err) => {
    console.error("❌ Failed to build Germany hierarchy:", err);
    process.exit(1);
});
