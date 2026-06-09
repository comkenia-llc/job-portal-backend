"use strict";

/**
 * Build a hierarchical UAE locations JSON from the exported OSM GeoJSON.
 * Usage: node src/scripts/buildUaeLocations.js
 */

const fs = require("fs");
const path = require("path");
const turf = require("@turf/turf");

const SOURCE_PATH = path.resolve(__dirname, "../data/uae-places.geojson");
const OUTPUT_PATH = path.resolve(__dirname, "../data/uae-hierarchy.json");

const EMIRATE_DEFS = [
    { name: "Abu Dhabi", aliases: ["abu dhabi", "abudhabi", "abu-dhabi", "abu ẓaby"] },
    { name: "Dubai", aliases: ["dubai", "dubayy"] },
    { name: "Sharjah", aliases: ["sharjah", "ash shariqah", "ash sharjah"] },
    { name: "Ajman", aliases: ["ajman", "ʿajmān"] },
    { name: "Umm Al Quwain", aliases: ["umm al quwain", "umm al-quwain", "umm al qwain", "umm al-qaiwain"] },
    { name: "Ras Al Khaimah", aliases: ["ras al khaimah", "ras al-khaimah", "ras al khaim", "ra's al-khaymah"] },
    { name: "Fujairah", aliases: ["fujairah", "al fujairah", "al-fujairah"] },
];

const CITY_PLACES = new Set(["city", "town", "municipality", "village", "hamlet"]);
const NEIGHBORHOOD_PLACES = new Set(["suburb", "neighbourhood", "neighborhood", "quarter"]);

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

const CITY_NAME_HINTS = new Map(
    [
        ["abu dhabi", "Abu Dhabi"],
        ["al ain", "Abu Dhabi"],
        ["al-ain", "Abu Dhabi"],
        ["madinat zayed", "Abu Dhabi"],
        ["ruwais", "Abu Dhabi"],
        ["liwa", "Abu Dhabi"],
        ["bani yas", "Abu Dhabi"],
        ["ghayathi", "Abu Dhabi"],
        ["al dhafra", "Abu Dhabi"],
        ["al mirfa", "Abu Dhabi"],
        ["musaffah", "Abu Dhabi"],
        ["dubai", "Dubai"],
        ["jebel ali", "Dubai"],
        ["hatta", "Dubai"],
        ["sharjah", "Sharjah"],
        ["khor fakkan", "Sharjah"],
        ["kalba", "Sharjah"],
        ["dibba al hisn", "Sharjah"],
        ["ajman", "Ajman"],
        ["umm al quwain", "Umm Al Quwain"],
        ["ras al khaimah", "Ras Al Khaimah"],
        ["ras al-khaimah", "Ras Al Khaimah"],
        ["fujairah", "Fujairah"],
        ["dibba al fujairah", "Fujairah"],
        ["dibba al-fujairah", "Fujairah"],
        ["diba", "Fujairah"],
    ].map(([k, v]) => [normalize(k), v])
);

const readGeoJson = () => {
    if (!fs.existsSync(SOURCE_PATH)) {
        console.error(`❌ Missing GeoJSON source at ${SOURCE_PATH}`);
        process.exit(1);
    }
    return JSON.parse(fs.readFileSync(SOURCE_PATH, "utf8"));
};

const getName = (props = {}) =>
    props["name:en"] ||
    props.name ||
    props["name:ar"] ||
    props["name:fr"] ||
    props["name:de"];

const getCentroidCoords = (feature) => {
    try {
        const centroid = turf.centroid(feature);
        const [lng, lat] = centroid.geometry.coordinates;
        return { lat, lng };
    } catch (err) {
        return { lat: null, lng: null };
    }
};

const matchEmirate = (value) => {
    if (!value) return null;
    const clean = normalize(value);
    return (
        EMIRATE_DEFS.find((emirate) =>
            emirate.aliases.some((alias) => clean.includes(alias))
        ) || null
    );
};

const detectEmirate = (props, point, emiratePolygons, hintName) => {
    const sourceFields = [
        props["is_in:state"],
        props["addr:state"],
        props["is_in:emirate"],
        props["state"],
        props["is_in:province"],
        props["addr:province"],
        props["is_in"],
        props["reg_name"],
        props["reg_name:en"],
        props["addr:region"],
    ];

    for (const val of sourceFields) {
        const match = matchEmirate(val);
        if (match) return match.name;
    }

    if (point && emiratePolygons.length) {
        for (const emirate of emiratePolygons) {
            if (!emirate.geometry) continue;
            try {
                if (turf.booleanPointInPolygon(point, emirate.geometry)) {
                    return emirate.name;
                }
            } catch (err) {
                // ignore invalid polygon errors
            }
        }
    }

    if (hintName) {
        const hint = CITY_NAME_HINTS.get(normalize(hintName));
        if (hint) return hint;
    }
    return null;
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
        const centroid = turf.centroid(feature);
        return centroid;
    } catch (err) {
        return null;
    }
};

const buildHierarchy = () => {
    const geojson = readGeoJson();
    const features = geojson.features || [];

    const emirateFeatures = [];
    const cityFeatures = [];
    const neighborhoodFeatures = [];

    for (const feature of features) {
        const props = feature.properties || {};
        const name = getName(props);
        if (!name) continue;

        const boundary = (props.boundary || "").toLowerCase();
        const adminLevel = props.admin_level ? parseInt(props.admin_level, 10) : null;
        const place = (props.place || "").toLowerCase();

        if (boundary === "administrative" && adminLevel === 4) {
            emirateFeatures.push({ feature, props, name });
            continue;
        }

        if (CITY_PLACES.has(place) || (boundary === "administrative" && adminLevel && adminLevel <= 6)) {
            cityFeatures.push({ feature, props, name });
            continue;
        }

        if (NEIGHBORHOOD_PLACES.has(place) || (boundary === "administrative" && adminLevel && adminLevel >= 8)) {
            neighborhoodFeatures.push({ feature, props, name });
        }
    }

    const emirateMap = new Map();
    const emiratePolygons = [];

    for (const def of EMIRATE_DEFS) {
        const match = emirateFeatures.find(({ name }) => normalize(name) === normalize(def.name));
        const geometry = match?.feature?.geometry || null;
        const centroid = geometry ? getCentroidCoords(match.feature) : { lat: null, lng: null };
        const slug = `uae-${slugify(def.name)}`;
        const emirateData = {
            name: def.name,
            slug,
            lat: centroid.lat,
            lng: centroid.lng,
            geometry: match?.feature || null,
            cities: [],
        };
        emirateMap.set(def.name, emirateData);
        if (geometry && geometry.type && geometry.type !== "Point") {
            emiratePolygons.push({ name: def.name, geometry: match.feature });
        }
    }

    const cityMap = new Map();

    for (const { feature, props, name } of cityFeatures) {
        const point = booleanPoint(feature);
        const emirateName = detectEmirate(props, point, emiratePolygons, name);
        if (!emirateName || !emirateMap.has(emirateName)) {
            continue;
        }

        const coords = getCentroidCoords(feature);
        const slug = `uae-${slugify(name)}`;
        const cityData = {
            name,
            slug,
            lat: coords.lat,
            lng: coords.lng,
            emirateSlug: emirateMap.get(emirateName).slug,
            neighborhoods: [],
            point,
        };
        cityMap.set(slug, cityData);
        emirateMap.get(emirateName).cities.push(cityData);
    }

    const normalizeCityLookup = new Map();
    for (const city of cityMap.values()) {
        normalizeCityLookup.set(normalize(city.name), city.slug);
    }

const findNearestCity = (point, emirateSlug) => {
    if (!point) return null;
        let best = null;
        for (const city of cityMap.values()) {
            if (emirateSlug && city.emirateSlug !== emirateSlug) continue;
            if (!city.point) continue;
            try {
                const dist = turf.distance(point, city.point, { units: "kilometers" });
                if (!best || dist < best.dist) {
                    best = { city, dist };
                }
            } catch (err) {
                // ignore invalid geometry
            }
        }
        return best?.city || null;
    };

    let skippedNeighborhoods = 0;

    for (const { feature, props, name } of neighborhoodFeatures) {
        const point = booleanPoint(feature);
        const emirateName = detectEmirate(props, point, emiratePolygons, name);
        let candidateEmirateSlug = emirateName && emirateMap.has(emirateName) ? emirateMap.get(emirateName).slug : null;

        const cityNameCandidate = detectCityName(props);
        let city = null;
        if (cityNameCandidate) {
            const candidateSlug = normalizeCityLookup.get(normalize(cityNameCandidate));
            if (candidateSlug) {
                city = cityMap.get(candidateSlug);
            }
        }

        if (!city && candidateEmirateSlug) {
            city = findNearestCity(point, candidateEmirateSlug);
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

    const country = {
        name: "United Arab Emirates",
        code: "AE",
        slug: "united-arab-emirates",
        lat: 23.4241,
        lng: 53.8478,
    };

    const emirates = Array.from(emirateMap.values()).map((emirate) => ({
        name: emirate.name,
        slug: emirate.slug,
        lat: emirate.lat,
        lng: emirate.lng,
        cities: emirate.cities
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((city) => ({
                name: city.name,
                slug: city.slug,
                lat: city.lat,
                lng: city.lng,
                neighborhoods: city.neighborhoods.sort((a, b) => a.name.localeCompare(b.name)),
            })),
    }));

    const output = {
        generatedAt: new Date().toISOString(),
        source: path.relative(process.cwd(), SOURCE_PATH),
        country,
        emirates,
        stats: {
            emirateCount: emirates.length,
            cityCount: cityMap.size,
            neighborhoodCount: emirates.reduce(
                (sum, emirate) =>
                    sum +
                    emirate.cities.reduce(
                        (citySum, city) => citySum + city.neighborhoods.length,
                        0
                    ),
                0
            ),
            skippedNeighborhoods,
        },
    };

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
    console.log(`✅ UAE hierarchy written to ${path.relative(process.cwd(), OUTPUT_PATH)}`);
    console.log(
        `   Emirates: ${output.stats.emirateCount}, Cities: ${output.stats.cityCount}, Neighborhoods: ${output.stats.neighborhoodCount}, Skipped neighborhoods: ${output.stats.skippedNeighborhoods}`
    );
};

buildHierarchy();
