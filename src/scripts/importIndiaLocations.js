"use strict";

/**
 * Import India location hierarchy from src/data/india-hierarchy.json
 * into the Locations table with India market scoping and SEO metadata.
 *
 * Usage: node src/scripts/importIndiaLocations.js
 */

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { sequelize, Location } = require("../models");
const fetchImage = require("../utils/fetchImage");
const { buildLocationSeo } = require("../data/locationSeoTemplates");

const HIERARCHY_PATH = path.resolve(__dirname, "../data/india-hierarchy.json");
const MARKET = "india";
const COUNTRY_NAME = "India";
const COUNTRY_CODE = "IN";
const TIMEZONE = "Asia/Kolkata";
const CONTINENT = "Asia";
const CURRENCY = "INR";
const IMPORT_IMAGES =
    String(process.env.IMPORT_INDIA_LOCATION_IMAGES || "false").trim().toLowerCase() ===
    "true";
const FLAG_PATH =
    process.env.INDIA_FLAG_PATH || "/uploads/locations/flags/default.png";
const DEFAULT_IMAGE = process.env.INDIA_DEFAULT_LOCATION_IMAGE || null;
const PUBLIC_BASE_URL = (
    process.env.INDIA_PUBLIC_APP_URL ||
    process.env.PUBLIC_APP_URL ||
    "https://indiajobzone.com"
)
    .trim()
    .replace(/\/+$/, "");

const slugify = (value = "") =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

const normalizeSlug = ({ slug, name, type, parentSlug }) => {
    let normalized = (slug || "").trim().toLowerCase();
    normalized = normalized.replace(/^-+|-+$/g, "");

    if (!normalized) {
        const base = slugify(name || type);
        normalized = parentSlug ? `${parentSlug}--${base}` : base;
    }

    if (parentSlug && normalized === parentSlug) {
        const suffix = slugify(name || type) || slugify(type) || "location";
        normalized = `${parentSlug}--${suffix}`;
    }

    return normalized;
};

const processedSlugMap = new Set();
const registerSlug = (type, slug) => {
    const key = `${type}::${slug}`;
    if (processedSlugMap.has(key)) return false;
    processedSlugMap.add(key);
    return true;
};

const loadHierarchy = () => {
    if (!fs.existsSync(HIERARCHY_PATH)) {
        throw new Error(`India hierarchy file not found at ${HIERARCHY_PATH}`);
    }
    return JSON.parse(fs.readFileSync(HIERARCHY_PATH, "utf8"));
};

const buildBasePayload = ({
    name,
    slug,
    type,
    parentId = null,
    lat,
    lng,
    stateName,
    cityName,
}) => {
    const base = {
        name,
        slug,
        market: MARKET,
        parentId,
        type,
        country: COUNTRY_NAME,
        countryCode: COUNTRY_CODE,
        continent: CONTINENT,
        timezone: TIMEZONE,
        currency: CURRENCY,
        latitude: lat || null,
        longitude: lng || null,
        flag: FLAG_PATH,
        image: DEFAULT_IMAGE,
        metaImage: DEFAULT_IMAGE,
        isFeatured: type === "state" || type === "city",
        city: cityName || (type === "city" ? name : null),
        state: type === "state" ? name : stateName || null,
        canonicalUrl: `${PUBLIC_BASE_URL}/locations/${slug}`,
        lastUpdated: new Date(),
    };

    const seo = buildLocationSeo({
        name,
        type,
        stateName: base.state,
        cityName: base.city,
        country: COUNTRY_NAME,
        slug,
    });

    return {
        ...base,
        seoTitle: seo.seoTitle,
        seoDescription: seo.seoDescription,
        seoKeywords: seo.seoKeywords,
        schemaType: seo.schemaType,
        faqSchema: seo.faqSchema,
        tags: seo.tags,
    };
};

const assignImage = async (payload) => {
    if (!IMPORT_IMAGES) return payload;
    if (payload.type === "neighborhood") return payload;
    try {
        const imgPath = await fetchImage(payload.name, payload.slug);
        if (imgPath) {
            payload.image = imgPath;
            payload.metaImage = imgPath;
        }
    } catch (err) {
        console.log(`⚠️ fetchImage failed for ${payload.slug}:`, err.message);
    }
    return payload;
};

const LOCATION_COLUMNS = [
    "name",
    "market",
    "country",
    "countryCode",
    "state",
    "city",
    "slug",
    "latitude",
    "longitude",
    "continent",
    "timezone",
    "currency",
    "flag",
    "parentId",
    "type",
    "image",
    "isFeatured",
    "seoTitle",
    "seoDescription",
    "seoKeywords",
    "canonicalUrl",
    "metaImage",
    "schemaType",
    "faqSchema",
    "tags",
    "lastUpdated",
    "createdAt",
    "updatedAt",
];

const saveLocation = async (payload, transaction) => {
    const { slug } = payload;
    let record = await Location.findOne({ where: { slug }, transaction });
    const created = !record;

    if (record) {
        if (!payload.image && record.image) payload.image = record.image;
        if (!payload.metaImage && record.metaImage) {
            payload.metaImage = record.metaImage;
        }
    }

    const now = new Date();
    const row = {
        ...payload,
        faqSchema: JSON.stringify(payload.faqSchema || []),
        tags: JSON.stringify(payload.tags || []),
        lastUpdated: payload.lastUpdated || now,
        createdAt: created ? now : record.createdAt,
        updatedAt: now,
    };

    const columnsSql = LOCATION_COLUMNS.map((col) => `\`${col}\``).join(", ");
    const placeholders = LOCATION_COLUMNS.map(() => "?").join(", ");
    const updateSql = LOCATION_COLUMNS
        .filter((col) => col !== "slug" && col !== "createdAt")
        .map((col) => `\`${col}\`=VALUES(\`${col}\`)`)
        .join(", ");

    const values = LOCATION_COLUMNS.map((col) => row[col] ?? null);

    await sequelize.query(
        `INSERT INTO \`${Location.getTableName()}\` (${columnsSql}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updateSql}`,
        { replacements: values, transaction }
    );

    if (created || !record) {
        record = await Location.findOne({ where: { slug }, transaction });
    } else {
        await record.reload({ transaction });
    }
    return { record, created };
};

const run = async () => {
    const data = loadHierarchy();
    const stats = { created: 0, updated: 0 };

    await sequelize.transaction(async (transaction) => {
        const countryPayload = buildBasePayload({
            name: data.country.name,
            slug: data.country.slug,
            type: "country",
            parentId: null,
            lat: data.country.lat,
            lng: data.country.lng,
            stateName: null,
            cityName: null,
        });
        countryPayload.slug = normalizeSlug({
            slug: countryPayload.slug,
            name: countryPayload.name,
            type: countryPayload.type,
        });
        countryPayload.canonicalUrl = `${PUBLIC_BASE_URL}/locations/${countryPayload.slug}`;
        registerSlug(countryPayload.type, countryPayload.slug);
        await assignImage(countryPayload);
        const { record: countryRecord, created: countryCreated } =
            await saveLocation(countryPayload, transaction);
        stats[countryCreated ? "created" : "updated"]++;

        for (const state of data.states || []) {
            const statePayload = buildBasePayload({
                name: state.name,
                slug: state.slug,
                type: "state",
                parentId: countryRecord.id,
                lat: state.lat,
                lng: state.lng,
                stateName: state.name,
                cityName: null,
            });
            statePayload.slug = normalizeSlug({
                slug: statePayload.slug,
                name: statePayload.name,
                type: statePayload.type,
                parentSlug: countryPayload.slug,
            });
            statePayload.canonicalUrl = `${PUBLIC_BASE_URL}/locations/${statePayload.slug}`;
            if (!registerSlug(statePayload.type, statePayload.slug)) continue;
            await assignImage(statePayload);

            const { record: stateRecord, created: stateCreated } =
                await saveLocation(statePayload, transaction);
            stats[stateCreated ? "created" : "updated"]++;

            for (const city of state.cities || []) {
                const cityPayload = buildBasePayload({
                    name: city.name,
                    slug: city.slug,
                    type: "city",
                    parentId: stateRecord.id,
                    lat: city.lat,
                    lng: city.lng,
                    stateName: state.name,
                    cityName: city.name,
                });
                cityPayload.slug = normalizeSlug({
                    slug: cityPayload.slug,
                    name: cityPayload.name,
                    type: cityPayload.type,
                    parentSlug: statePayload.slug,
                });
                cityPayload.canonicalUrl = `${PUBLIC_BASE_URL}/locations/${cityPayload.slug}`;
                if (!registerSlug(cityPayload.type, cityPayload.slug)) continue;
                await assignImage(cityPayload);

                const { record: cityRecord, created: cityCreated } =
                    await saveLocation(cityPayload, transaction);
                stats[cityCreated ? "created" : "updated"]++;

                for (const neighborhood of city.neighborhoods || []) {
                    const neighborhoodPayload = buildBasePayload({
                        name: neighborhood.name,
                        slug: neighborhood.slug,
                        type: "neighborhood",
                        parentId: cityRecord.id,
                        lat: neighborhood.lat,
                        lng: neighborhood.lng,
                        stateName: state.name,
                        cityName: city.name,
                    });
                    neighborhoodPayload.slug = normalizeSlug({
                        slug: neighborhoodPayload.slug,
                        name: neighborhoodPayload.name,
                        type: neighborhoodPayload.type,
                        parentSlug: cityPayload.slug,
                    });
                    neighborhoodPayload.canonicalUrl = `${PUBLIC_BASE_URL}/locations/${neighborhoodPayload.slug}`;
                    if (
                        !registerSlug(
                            neighborhoodPayload.type,
                            neighborhoodPayload.slug
                        )
                    ) {
                        continue;
                    }
                    await assignImage(neighborhoodPayload);

                    const { created: neighborhoodCreated } = await saveLocation(
                        neighborhoodPayload,
                        transaction
                    );
                    stats[neighborhoodCreated ? "created" : "updated"]++;
                }
            }
        }
    });

    console.log(
        `✅ India locations import complete. Created: ${stats.created}, Updated: ${stats.updated}`
    );
};

run()
    .catch((err) => {
        console.error("❌ India locations import failed:", err);
        process.exitCode = 1;
    })
    .finally(async () => {
        try {
            await sequelize.close();
        } catch {
            // ignore close errors
        }
    });
