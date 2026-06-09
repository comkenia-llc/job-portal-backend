"use strict";

/**
 * Build a hierarchical Saudi Arabia locations JSON from the exported OSM GeoJSON sequence.
 * Usage: node src/scripts/buildSaudiLocations.js
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const turf = require("@turf/turf");

const SOURCE_PATH = path.resolve(__dirname, "../data/saudi-places.geojsonseq");
const OUTPUT_PATH = path.resolve(__dirname, "../data/saudi-hierarchy.json");

const REGION_DEFS = [
    { name: "Riyadh", aliases: ["riyadh", "ar riyad"] },
    { name: "Makkah", aliases: ["makkah", "mecca", "makkah al mukarramah"] },
    { name: "Madinah", aliases: ["madinah", "medina", "al madinah"] },
    {
        name: "Eastern Province",
        aliases: ["eastern province", "ash sharqiyah", "al sharqiyah"],
    },
    { name: "Asir", aliases: ["asir", "aseer"] },
    { name: "Tabuk", aliases: ["tabuk", "tabouk"] },
    { name: "Hail", aliases: ["hail", "ha'il", "hayel"] },
    { name: "Northern Borders", aliases: ["northern borders", "al hudud ash shamaliyah"] },
    { name: "Jazan", aliases: ["jazan", "jizan", "جازان"] },
    { name: "Najran", aliases: ["najran", "najraan"] },
    { name: "Al Bahah", aliases: ["al bahah", "al baha", "bahah", "baha"] },
    { name: "Al Jawf", aliases: ["al jawf", "jawf", "al jouf"] },
    { name: "Al Qassim", aliases: ["al qassim", "qassim", "qasim", "al القصيم"] },
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

const matchRegion = (value) => {
    if (!value) return null;
    const clean = normalize(value);
    return (
        REGION_DEFS.find((region) =>
            region.aliases.some((alias) => clean.includes(alias))
        ) || null
    );
};

const detectRegion = (props, point, regionPolygons, hintName) => {
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
        const match = matchRegion(val);
        if (match) return match.name;
    }

    if (point && regionPolygons.length) {
        for (const region of regionPolygons) {
            if (!region.geometry) continue;
            try {
                if (turf.booleanPointInPolygon(point, region.geometry)) {
                    return region.name;
                }
            } catch {
                // ignore invalid geometry
            }
        }
    }

    const hint = matchRegion(hintName);
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
    const regionFeatures = [];
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
            REGION_DEFS.some((region) => normalize(region.name) === normalize(name))
        ) {
            regionFeatures.push({ feature, props, name });
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

    const regionMap = new Map();
    const regionPolygons = [];

    for (const def of REGION_DEFS) {
        const match = regionFeatures.find(
            ({ name }) => normalize(name) === normalize(def.name)
        );
        const geometry = match?.feature?.geometry || null;
        const centroid = geometry
            ? getCentroidCoords(match.feature)
            : { lat: null, lng: null };
        const slug = `saudi-${slugify(def.name)}`;
        const regionData = {
            name: def.name,
            slug,
            lat: centroid.lat,
            lng: centroid.lng,
            geometry: match?.feature || null,
            cities: [],
        };
        regionMap.set(def.name, regionData);
        if (geometry && geometry.type && geometry.type !== "Point") {
            regionPolygons.push({ name: def.name, geometry: match.feature });
        }
    }

    const cityMap = new Map();

    for (const { feature, props, name } of cityFeatures) {
        const point = booleanPoint(feature);
        const regionName = detectRegion(props, point, regionPolygons, name);
        if (!regionName || !regionMap.has(regionName)) continue;

        const coords = getCentroidCoords(feature);
        const regionSlug = regionMap.get(regionName).slug;
        const slug = `${regionSlug}--${slugify(name)}`;
        const key = `${regionSlug}::${normalize(name)}`;
        if (cityMap.has(key)) continue;

        const cityData = {
            name,
            slug,
            lat: coords.lat,
            lng: coords.lng,
            regionSlug,
            neighborhoods: [],
            point,
        };
        cityMap.set(key, cityData);
        regionMap.get(regionName).cities.push(cityData);
    }

    const findNearestCity = (point, regionSlug) => {
        if (!point) return null;
        let best = null;
        for (const city of cityMap.values()) {
            if (regionSlug && city.regionSlug !== regionSlug) continue;
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
        const regionName = detectRegion(props, point, regionPolygons, name);
        const regionSlug =
            regionName && regionMap.has(regionName)
                ? regionMap.get(regionName).slug
                : null;

        let city = null;
        const cityNameCandidate = detectCityName(props);
        if (cityNameCandidate && regionSlug) {
            city = cityMap.get(`${regionSlug}::${normalize(cityNameCandidate)}`) || null;
        }

        if (!city && regionSlug) {
            city = findNearestCity(point, regionSlug);
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

    const states = Array.from(regionMap.values()).map((region) => ({
        name: region.name,
        slug: region.slug,
        lat: region.lat,
        lng: region.lng,
        cities: region.cities
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
            name: "Saudi Arabia",
            code: "SA",
            slug: "saudi",
            lat: 23.8859,
            lng: 45.0792,
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
        `✅ Saudi Arabia hierarchy written to ${path.relative(process.cwd(), OUTPUT_PATH)}`
    );
    console.log(
        `   States: ${output.stats.stateCount}, Cities: ${output.stats.cityCount}, Neighborhoods: ${output.stats.neighborhoodCount}, Skipped neighborhoods: ${output.stats.skippedNeighborhoods}`
    );
};

buildHierarchy().catch((err) => {
    console.error("❌ Failed to build Saudi Arabia hierarchy:", err);
    process.exit(1);
});
