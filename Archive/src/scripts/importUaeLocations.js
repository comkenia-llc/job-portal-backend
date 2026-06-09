"use strict";

/**
 * Import UAE location hierarchy from src/data/uae-hierarchy.json
 * into the Locations table with proper parent/child relationships
 * and default SEO metadata.
 *
 * Usage: node src/scripts/importUaeLocations.js
 */

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { sequelize, Location } = require("../models");
const fetchImage = require("../utils/fetchImage");

const HIERARCHY_PATH = path.resolve(__dirname, "../data/uae-hierarchy.json");
const COUNTRY_NAME = "United Arab Emirates";
const COUNTRY_CODE = "AE";
const TIMEZONE = "Asia/Dubai";
const CONTINENT = "Asia";
const CURRENCY = "AED";
const FLAG_PATH = "/uploads/locations/flags/ae.png";
const DEFAULT_IMAGE = process.env.DEFAULT_IMAGE || "/uploads/locations/default.jpg";

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
        throw new Error(`UAE hierarchy file not found at ${HIERARCHY_PATH}`);
    }
    return JSON.parse(fs.readFileSync(HIERARCHY_PATH, "utf8"));
};

const truncate = (text, max = 160) => {
    if (!text) return "";
    if (text.length <= max) return text;
    return text.slice(0, max - 3).trimEnd() + "...";
};

const { buildLocationSeo } = require("../data/locationSeoTemplates");

const buildBasePayload = ({ name, slug, type, parentId = null, lat, lng, stateName, cityName }) => {
    const base = {
        name,
        slug,
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
        canonicalUrl: `https://dubaijobzone.com/locations/${slug}`,
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

    // If record exists and already has an image, preserve it unless payload has a new one
    if (record) {
        if (!payload.image && record.image) payload.image = record.image;
        if (!payload.metaImage && record.metaImage) payload.metaImage = record.metaImage;
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
        countryPayload.canonicalUrl = `https://dubaijobzone.com/locations/${countryPayload.slug}`;
        registerSlug(countryPayload.type, countryPayload.slug);
        await assignImage(countryPayload);
        const { record: countryRecord, created: countryCreated } = await saveLocation(countryPayload, transaction);
        stats[countryCreated ? "created" : "updated"]++;

        for (const emirate of data.emirates) {
            const emiratePayload = buildBasePayload({
                name: emirate.name,
                slug: emirate.slug,
                type: "state",
                parentId: countryRecord.id,
                lat: emirate.lat,
                lng: emirate.lng,
                stateName: emirate.name,
            });
            emiratePayload.slug = normalizeSlug({
                slug: emiratePayload.slug,
                name: emiratePayload.name,
                type: emiratePayload.type,
                parentSlug: countryRecord.slug,
            });
            emiratePayload.canonicalUrl = `https://dubaijobzone.com/locations/${emiratePayload.slug}`;
            if (!registerSlug(emiratePayload.type, emiratePayload.slug)) {
                console.log(`⚠️ Duplicate emirate slug ${emiratePayload.slug} skipped`);
                continue;
            }

            await assignImage(emiratePayload);
            const { record: emirateRecord, created: emirateCreated } = await saveLocation(emiratePayload, transaction);
            stats[emirateCreated ? "created" : "updated"]++;

            for (const city of emirate.cities) {
                const cityPayload = buildBasePayload({
                    name: city.name,
                    slug: city.slug,
                    type: "city",
                    parentId: emirateRecord.id,
                    lat: city.lat,
                    lng: city.lng,
                    stateName: emirate.name,
                    cityName: city.name,
                });
                cityPayload.slug = normalizeSlug({
                    slug: cityPayload.slug,
                    name: cityPayload.name,
                    type: cityPayload.type,
                    parentSlug: emirateRecord.slug,
                });
                cityPayload.canonicalUrl = `https://dubaijobzone.com/locations/${cityPayload.slug}`;
                if (!registerSlug(cityPayload.type, cityPayload.slug)) {
                    console.log(`⚠️ Duplicate city slug ${cityPayload.slug} skipped`);
                    continue;
                }
                await assignImage(cityPayload);
                const { record: cityRecord, created: cityCreated } = await saveLocation(cityPayload, transaction);
                stats[cityCreated ? "created" : "updated"]++;

                for (const neighborhood of city.neighborhoods) {
                    const neighborhoodPayload = buildBasePayload({
                        name: neighborhood.name,
                        slug: neighborhood.slug,
                        type: "neighborhood",
                        parentId: cityRecord.id,
                        lat: neighborhood.lat,
                        lng: neighborhood.lng,
                        stateName: emirate.name,
                        cityName: city.name,
                    });
                    neighborhoodPayload.slug = normalizeSlug({
                        slug: neighborhoodPayload.slug,
                        name: neighborhoodPayload.name,
                        type: neighborhoodPayload.type,
                        parentSlug: cityRecord.slug,
                    });
                    neighborhoodPayload.canonicalUrl = `https://dubaijobzone.com/locations/${neighborhoodPayload.slug}`;
                    if (!registerSlug(neighborhoodPayload.type, neighborhoodPayload.slug)) {
                        console.log(`⚠️ Duplicate neighborhood slug ${neighborhoodPayload.slug} skipped`);
                        continue;
                    }
                    const { created: neighborhoodCreated } = await saveLocation(neighborhoodPayload, transaction);
                    stats[neighborhoodCreated ? "created" : "updated"]++;
                }
            }
        }
    });

    console.log(
        `✅ Locations import complete. Created: ${stats.created}, Updated: ${stats.updated}`
    );
};

run()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("❌ Failed to import locations:", err);
        process.exit(1);
    });
