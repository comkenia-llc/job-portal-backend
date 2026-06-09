"use strict";

/**
 * Pakistan Companies Importer
 * - Wikidata-based seed import
 * - PK market scoping
 * - Location mapping against imported PK locations
 * - SEO-ready company fields for /employers/{slug}
 *
 * Usage:
 *   node src/scripts/importPkCompanies.js
 */

require("dotenv").config();

const { Op } = require("sequelize");
const { Company, Location } = require("../models");

const fetch = globalThis.fetch;
const ENDPOINT = "https://query.wikidata.org/sparql";
const MARKET = "pk";
const COUNTRY = "Pakistan";
const PUBLIC_BASE_URL = (
    process.env.PK_PUBLIC_APP_URL ||
    process.env.PUBLIC_APP_URL ||
    "https://pkjobzone.com"
)
    .trim()
    .replace(/\/+$/, "");

const PAGE_SIZE = parseInt(process.env.PK_COMPANY_IMPORT_PAGE_SIZE || "500", 10);
const MAX_PAGES = parseInt(process.env.PK_COMPANY_IMPORT_MAX_PAGES || "20", 10);
const DELAY_MS = parseInt(process.env.PK_COMPANY_IMPORT_DELAY_MS || "1200", 10);
const CREATED_BY = parseInt(process.env.PK_COMPANY_IMPORT_CREATED_BY || "1", 10);

const baseQuery = `
SELECT ?company ?companyLabel ?legalName ?industryLabel ?website ?linkedin ?twitter ?facebook ?founded ?hqLabel
WHERE {
  ?company wdt:P31/wdt:P279* wd:Q4830453.

  {
    ?company wdt:P17 wd:Q843.
  }
  UNION {
    ?company wdt:P159 ?hq.
    ?hq wdt:P17 wd:Q843.
  }

  OPTIONAL { ?company wdt:P1448 ?legalName. }
  OPTIONAL { ?company wdt:P452 ?industry. }
  OPTIONAL { ?company wdt:P856 ?website. }
  OPTIONAL { ?company wdt:P6634 ?linkedin. }
  OPTIONAL { ?company wdt:P2002 ?twitter. }
  OPTIONAL { ?company wdt:P2013 ?facebook. }
  OPTIONAL { ?company wdt:P571 ?founded. }
  OPTIONAL { ?company wdt:P159 ?hq. }

  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const slugifyValue = (value = "") =>
    value
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 90);

const normalizeText = (value = "") =>
    String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s,-]/g, "")
        .replace(/\s+/g, " ");

const stringHash = (value = "") => {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
        hash = (hash << 5) - hash + value.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
};

const pick = (arr, seed) => arr[seed % arr.length];

async function generateUniqueCompanySlug(rawValue, market, excludeId = null) {
    const base = slugifyValue(rawValue) || `${market}-company-${Date.now()}`;
    let slug = base;
    let counter = 1;

    while (
        await Company.findOne({
            where: {
                slug,
                ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}),
            },
            attributes: ["id"],
        })
    ) {
        slug = `${base}-${market}-${counter++}`;
    }

    return slug;
}

function buildLocationLookup(locations) {
    const map = new Map();
    const register = (key, location) => {
        const normalized = normalizeText(key);
        if (!normalized) return;
        if (!map.has(normalized)) {
            map.set(normalized, location);
        }
    };

    for (const location of locations) {
        register(location.name, location);
        register(location.city, location);
        if (location.name && location.state) {
            register(`${location.name}, ${location.state}`, location);
        }
        if (location.city && location.state) {
            register(`${location.city}, ${location.state}`, location);
        }
        if (location.name && location.country) {
            register(`${location.name}, ${location.country}`, location);
        }
    }

    return map;
}

function resolveLocationId(hqLabel, locationLookup) {
    if (!hqLabel) return null;
    const candidates = [
        hqLabel,
        ...String(hqLabel)
            .split(",")
            .map((part) => part.trim())
            .filter(Boolean),
    ];

    for (const candidate of candidates) {
        const exact = locationLookup.get(normalizeText(candidate));
        if (exact) return exact.id;
    }

    return null;
}

function buildAbout({ name, industry, locationName, foundedYear }) {
    const clauses = [
        `${name} is an employer profile focused on Pakistan hiring demand${locationName ? ` across ${locationName}` : ""}.`,
        industry ? `The company operates in ${industry} and can be discovered through market-specific company and job pages.` : "The profile supports company discovery for candidates researching employers and live opportunities.",
        foundedYear ? `Public reference data indicates the organisation was founded in ${foundedYear}.` : "Public reference data has been consolidated to improve employer visibility across search and internal discovery.",
    ];
    return clauses.join(" ");
}

function buildCompanySeo({ name, industry, locationName, slug }) {
    const seed = stringHash(`${slug}-${name}-${industry || ""}-${locationName || ""}`);
    const place = locationName || "Pakistan";
    const sector = industry || "business";

    const titlePatterns = [
        `${name} Jobs in ${place} | ${sector} Careers Pakistan`,
        `${name} Careers Pakistan | Hiring in ${place}`,
        `${name} Employer Profile | ${sector} Jobs in ${place}`,
        `${name} Vacancies in ${place} | Pakistan Careers`,
        `${name} Hiring Now | ${place} ${sector} Jobs`,
        `${name} Company Jobs | Careers Across ${place}`,
    ];

    const descOpeners = [
        `Explore ${name} hiring activity in ${place}.`,
        `Discover verified company details and open roles for ${name} in ${place}.`,
        `Track ${name} careers in ${place} with market-specific employer data.`,
        `Review ${name} as an employer and uncover opportunities in ${place}.`,
        `Browse ${name} company insights and Pakistan vacancies linked to ${place}.`,
    ];

    const descClosers = [
        `Compare roles, employer context, and search-ready company information for ${sector} candidates.`,
        `Use this employer page to evaluate active demand, company positioning, and Pakistan career relevance.`,
        `This profile is structured to connect candidates with searchable company information and location-linked opportunities.`,
        `Find company context, sector signals, and discoverability tailored to Pakistan employer search intent.`,
        `The page supports stronger employer discovery with sector, location, and career-focused metadata.`,
    ];

    return {
        seoTitle: pick(titlePatterns, seed),
        seoDescription: `${pick(descOpeners, seed)} ${pick(descClosers, Math.floor(seed / 5))}`,
        seoKeywords: [
            `${name} jobs`,
            `${name} careers`,
            `${name} ${place} jobs`,
            `${sector} jobs ${place}`,
            `${name} employer profile`,
        ].join(", "),
        tags: [
            name,
            `${name} jobs`,
            `${name} careers`,
            `${place} employers`,
            `${sector} hiring`,
        ],
    };
}

async function run() {
    console.log("🚀 Importing Pakistan companies with SEO metadata...");

    const locations = await Location.findAll({
        where: {
            market: MARKET,
            type: { [Op.in]: ["city", "state", "country"] },
        },
        attributes: ["id", "name", "city", "state", "country", "type"],
        raw: true,
    });
    const locationLookup = buildLocationLookup(locations);

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (let page = 0; page < MAX_PAGES; page++) {
        const offset = page * PAGE_SIZE;
        const query = `${baseQuery}\nLIMIT ${PAGE_SIZE}\nOFFSET ${offset}`;

        console.log(`📦 Pakistan companies page ${page + 1} (OFFSET ${offset})`);

        const res = await fetch(
            `${ENDPOINT}?format=json&query=${encodeURIComponent(query)}`,
            {
                headers: {
                    "User-Agent": "PKCompanyImporter/1.0 (jobs platform)",
                    Accept: "application/sparql+json",
                },
            }
        );

        if (!res.ok) {
            throw new Error(await res.text());
        }

        const rows = (await res.json()).results.bindings;
        if (!rows.length) {
            console.log("🛑 No more Pakistan company data");
            break;
        }

        for (const row of rows) {
            try {
                const name = row.companyLabel?.value?.trim();
                if (!name) {
                    skippedCount++;
                    continue;
                }

                const existing =
                    (await Company.findOne({
                        where: {
                            market: MARKET,
                            [Op.or]: [
                                { name },
                                ...(row.website?.value ? [{ website: row.website.value }] : []),
                            ],
                        },
                        attributes: ["id", "slug"],
                    })) || null;

                const slug = existing?.slug || (await generateUniqueCompanySlug(name, MARKET, existing?.id || null));
                const foundedYear = row.founded?.value
                    ? parseInt(row.founded.value.slice(0, 4), 10)
                    : null;
                const headquarters = row.hqLabel?.value?.trim() || null;
                const locationId = resolveLocationId(headquarters, locationLookup);
                const locationName =
                    headquarters ||
                    (locationId
                        ? locations.find((item) => item.id === locationId)?.name || null
                        : null);
                const industry = row.industryLabel?.value?.trim() || null;

                const seo = buildCompanySeo({
                    name,
                    industry,
                    locationName,
                    slug,
                });

                const payload = {
                    market: MARKET,
                    name,
                    legalName: row.legalName?.value?.trim() || null,
                    slug,
                    industry,
                    website: row.website?.value || null,
                    headquarters,
                    locationId,
                    linkedinUrl: row.linkedin?.value || null,
                    twitterUrl: row.twitter?.value || null,
                    facebookUrl: row.facebook?.value || null,
                    foundedYear,
                    tagline: industry
                        ? `${name} careers in ${locationName || "Pakistan"} across ${industry}.`
                        : `${name} careers and employer profile for Pakistan job seekers.`,
                    about: buildAbout({
                        name,
                        industry,
                        locationName,
                        foundedYear,
                    }),
                    verified: true,
                    status: "active",
                    createdBy: existing?.id ? undefined : CREATED_BY,
                    seoTitle: seo.seoTitle,
                    seoDescription: seo.seoDescription,
                    seoKeywords: seo.seoKeywords,
                    canonicalUrl: `${PUBLIC_BASE_URL}/employers/${slug}`,
                    metaImage: null,
                    schemaType: "Organization",
                    tags: seo.tags,
                    logoUrl: null,
                    bannerUrl: null,
                };

                if (existing) {
                    await Company.update(payload, { where: { id: existing.id } });
                    updatedCount++;
                } else {
                    await Company.create(payload);
                    createdCount++;
                }
            } catch (err) {
                skippedCount++;
                console.warn("⚠️ Skipped Pakistan company row:", err.message);
            }
        }

        console.log(
            `✅ Progress — created: ${createdCount}, updated: ${updatedCount}, skipped: ${skippedCount}`
        );
        await sleep(DELAY_MS);
    }

    console.log("🎉 Pakistan company import complete");
    console.log({ createdCount, updatedCount, skippedCount });
}

run().catch((err) => {
    console.error("❌ Pakistan company import failed:", err.message);
    process.exit(1);
});
