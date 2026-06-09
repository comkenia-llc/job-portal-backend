'use strict';

/**
 * UAE Companies Importer
 * System-aligned version
 * - NO external logos
 * - NO invalid URLs
 * - Safe for frontend
 */

const slugify = require("slugify");
const { Company } = require("../models");

const fetch = globalThis.fetch;
const ENDPOINT = "https://query.wikidata.org/sparql";

// ---------- CONFIG ----------
const PAGE_SIZE = 500;
const MAX_PAGES = 10;
const DELAY_MS = 1200;

// ---------- BASE QUERY ----------
const baseQuery = `
SELECT ?company ?companyLabel ?legalName ?industryLabel ?website ?linkedin ?twitter ?facebook ?founded ?hqLabel
WHERE {
  ?company wdt:P31/wdt:P279* wd:Q4830453.

  {
    ?company wdt:P17 wd:Q878.
  }
  UNION {
    ?company wdt:P159 wd:Q878.
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

// ---------- UTILS ----------
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---------- MAIN ----------
async function run() {
    console.log("🚀 Importing UAE companies (system-aligned)…");

    let inserted = 0;
    let skipped = 0;

    for (let page = 0; page < MAX_PAGES; page++) {
        const offset = page * PAGE_SIZE;

        const query = `
      ${baseQuery}
      LIMIT ${PAGE_SIZE}
      OFFSET ${offset}
    `;

        console.log(`📦 Page ${page + 1} (OFFSET ${offset})`);

        const res = await fetch(
            ENDPOINT + "?format=json&query=" + encodeURIComponent(query),
            {
                headers: {
                    "User-Agent": "UAECompanyImporter/1.0 (keekan)",
                    "Accept": "application/sparql+json"
                }
            }
        );

        if (!res.ok) {
            throw new Error(await res.text());
        }

        const rows = (await res.json()).results.bindings;

        if (!rows.length) {
            console.log("🛑 No more data");
            break;
        }

        for (const row of rows) {
            try {
                const name = row.companyLabel?.value;
                if (!name) {
                    skipped++;
                    continue;
                }

                const slug = slugify(name, { lower: true, strict: true });
                if (!slug) {
                    skipped++;
                    continue;
                }

                const foundedYear = row.founded?.value
                    ? parseInt(row.founded.value.slice(0, 4), 10)
                    : null;

                const [_, created] = await Company.findOrCreate({
                    where: { slug },
                    defaults: {
                        name,
                        legalName: row.legalName?.value || null,
                        industry: row.industryLabel?.value || null,
                        website: row.website?.value || null,
                        headquarters: row.hqLabel?.value || null,
                        linkedinUrl: row.linkedin?.value || null,
                        twitterUrl: row.twitter?.value || null,
                        facebookUrl: row.facebook?.value || null,
                        foundedYear,
                        logoUrl: null,       // 👈 IMPORTANT
                        bannerUrl: null,     // 👈 IMPORTANT
                        verified: true,
                        status: "active",
                        createdBy: 1,
                        schemaType: "Organization"
                    }
                });

                created ? inserted++ : skipped++;

            } catch {
                skipped++;
            }
        }

        console.log(`✅ Inserted so far: ${inserted}`);
        await sleep(DELAY_MS);
    }

    console.log("🎉 DONE");
    console.log("Inserted:", inserted);
    console.log("Skipped:", skipped);
}

run().catch(err => {
    console.error("❌ Import failed:", err.message);
    process.exit(1);
});
