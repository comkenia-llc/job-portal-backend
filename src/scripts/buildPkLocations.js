"use strict";

/**
 * Build a hierarchical Pakistan locations JSON from the exported OSM GeoJSON sequence.
 * Usage: node src/scripts/buildPkLocations.js
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const turf = require("@turf/turf");

const SOURCE_PATH = path.resolve(__dirname, "../data/pk-places.geojsonseq");
const OUTPUT_PATH = path.resolve(__dirname, "../data/pk-hierarchy.json");

const PROVINCE_DEFS = [
    { name: "Punjab", aliases: ["punjab"] },
    { name: "Sindh", aliases: ["sindh"] },
    {
        name: "Khyber Pakhtunkhwa",
        aliases: ["khyber pakhtunkhwa", "nwfp", "north west frontier province"],
    },
    { name: "Balochistan", aliases: ["balochistan", "balochistan province"] },
    {
        name: "Islamabad Capital Territory",
        aliases: ["islamabad capital territory", "islamabad", "ict"],
    },
    { name: "Gilgit-Baltistan", aliases: ["gilgit baltistan", "gilgit-baltistan"] },
    { name: "Azad Kashmir", aliases: ["azad kashmir", "ajk", "azad jammu and kashmir"] },
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

const matchProvince = (value) => {
    if (!value) return null;
    const clean = normalize(value);
    return (
        PROVINCE_DEFS.find((province) =>
            province.aliases.some((alias) => clean.includes(alias))
        ) || null
    );
};

const detectProvince = (props, point, provincePolygons, hintName) => {
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
        const match = matchProvince(val);
        if (match) return match.name;
    }

    if (point && provincePolygons.length) {
        for (const province of provincePolygons) {
            if (!province.geometry) continue;
            try {
                if (turf.booleanPointInPolygon(point, province.geometry)) {
                    return province.name;
                }
            } catch {
                // ignore invalid geometry
            }
        }
    }

    const hint = matchProvince(hintName);
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
    const provinceFeatures = [];
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
            PROVINCE_DEFS.some(
                (province) => normalize(province.name) === normalize(name)
            )
        ) {
            provinceFeatures.push({ feature, props, name });
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

    const provinceMap = new Map();
    const provincePolygons = [];

    for (const def of PROVINCE_DEFS) {
        const match = provinceFeatures.find(
            ({ name }) => normalize(name) === normalize(def.name)
        );
        const geometry = match?.feature?.geometry || null;
        const centroid = geometry
            ? getCentroidCoords(match.feature)
            : { lat: null, lng: null };
        const slug = `pk-${slugify(def.name)}`;
        const provinceData = {
            name: def.name,
            slug,
            lat: centroid.lat,
            lng: centroid.lng,
            geometry: match?.feature || null,
            cities: [],
        };
        provinceMap.set(def.name, provinceData);
        if (geometry && geometry.type && geometry.type !== "Point") {
            provincePolygons.push({ name: def.name, geometry: match.feature });
        }
    }

    const cityMap = new Map();

    for (const { feature, props, name } of cityFeatures) {
        const point = booleanPoint(feature);
        const provinceName = detectProvince(props, point, provincePolygons, name);
        if (!provinceName || !provinceMap.has(provinceName)) continue;

        const coords = getCentroidCoords(feature);
        const provinceSlug = provinceMap.get(provinceName).slug;
        const slug = `${provinceSlug}--${slugify(name)}`;
        const key = `${provinceSlug}::${normalize(name)}`;
        if (cityMap.has(key)) continue;

        const cityData = {
            name,
            slug,
            lat: coords.lat,
            lng: coords.lng,
            provinceSlug,
            neighborhoods: [],
            point,
        };
        cityMap.set(key, cityData);
        provinceMap.get(provinceName).cities.push(cityData);
    }

    const findNearestCity = (point, provinceSlug) => {
        if (!point) return null;
        let best = null;
        for (const city of cityMap.values()) {
            if (provinceSlug && city.provinceSlug !== provinceSlug) continue;
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
        const provinceName = detectProvince(props, point, provincePolygons, name);
        const provinceSlug =
            provinceName && provinceMap.has(provinceName)
                ? provinceMap.get(provinceName).slug
                : null;

        let city = null;
        const cityNameCandidate = detectCityName(props);
        if (cityNameCandidate && provinceSlug) {
            city = cityMap.get(`${provinceSlug}::${normalize(cityNameCandidate)}`) || null;
        }

        if (!city && provinceSlug) {
            city = findNearestCity(point, provinceSlug);
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

    const states = Array.from(provinceMap.values()).map((province) => ({
        name: province.name,
        slug: province.slug,
        lat: province.lat,
        lng: province.lng,
        cities: province.cities
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
            name: "Pakistan",
            code: "PK",
            slug: "pk",
            lat: 30.3753,
            lng: 69.3451,
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
        `✅ Pakistan hierarchy written to ${path.relative(process.cwd(), OUTPUT_PATH)}`
    );
    console.log(
        `   States: ${output.stats.stateCount}, Cities: ${output.stats.cityCount}, Neighborhoods: ${output.stats.neighborhoodCount}, Skipped neighborhoods: ${output.stats.skippedNeighborhoods}`
    );
};

buildHierarchy().catch((err) => {
    console.error("❌ Failed to build Pakistan hierarchy:", err);
    process.exit(1);
});
