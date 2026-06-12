"use strict";

const { JobIndustry } = require("../models");

const TARGET_MARKET = process.env.SEED_MARKET || "dubai";
const NORMALIZED_MARKET = TARGET_MARKET.trim().toLowerCase();

const slugify = (value) =>
    (value || "")
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");

const industries = [
    "Hotel & Hospitality",
    "Restaurants & Food Service",
    "Construction",
    "Real Estate",
    "Retail",
    "Healthcare",
    "Education",
    "Transportation & Logistics",
    "Information Technology",
    "Engineering",
    "Security Services",
    "Facilities Management",
    "Cleaning Services",
    "Driving & Transportation",
    "Delivery Services",
    "Warehousing",
    "Manufacturing",
    "Oil & Gas",
    "Aviation",
    "Banking & Finance",
    "Insurance",
    "Sales",
    "Customer Service",
    "Human Resources",
    "Marketing & Advertising",
    "Accounting & Auditing",
    "Legal Services",
    "Travel & Tourism",
    "Beauty & Wellness",
    "Domestic Services",
];

async function run() {
    try {
        console.log(`🚀 Syncing ${industries.length} industries...`);
        console.log(`🌍 Market: ${NORMALIZED_MARKET}`);

        let created = 0;
        let updated = 0;

        for (const name of industries) {
            const slug = slugify(name);

            const payload = {
                name,
                slug,
                market: NORMALIZED_MARKET,
                description: `${name} jobs in ${NORMALIZED_MARKET}`,
                isFeatured: true,
                status: "active",
                schemaType: "DefinedTerm",
            };

            const existing = await JobIndustry.findOne({
                where: { slug, market: NORMALIZED_MARKET },
            });

            if (existing) {
                await existing.update(payload);
                updated++;
                console.log(`🔁 Updated: ${name}`);
                continue;
            }

            await JobIndustry.create(payload);
            created++;
            console.log(`✅ Created: ${name}`);
        }

        console.log("");
        console.log("=================================");
        console.log(`Created: ${created}`);
        console.log(`Updated: ${updated}`);
        console.log("=================================");

        process.exit(0);
    } catch (err) {
        console.error("❌ Seed failed");
        console.error(err);
        process.exit(1);
    }
}

run();
