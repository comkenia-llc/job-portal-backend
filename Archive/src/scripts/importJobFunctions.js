"use strict";

const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const args = new Set(process.argv.slice(2));
const isDryRun = args.has("--dry-run");
const onlyMissing = args.has("--only-missing");
const isVerbose = args.has("--verbose");

const fileArg = process.argv.find((arg) => arg.startsWith("--file="));
const customPath = fileArg ? fileArg.split("=")[1] : null;

const dbNameArg = process.argv.find((arg) => arg.startsWith("--db-name="));
const dbUserArg = process.argv.find((arg) => arg.startsWith("--db-user="));
const dbPassArg = process.argv.find((arg) => arg.startsWith("--db-pass="));
const dbHostArg = process.argv.find((arg) => arg.startsWith("--db-host="));
const dbDialectArg = process.argv.find((arg) => arg.startsWith("--db-dialect="));

if (dbNameArg) process.env.DB_NAME = dbNameArg.split("=")[1];
if (dbUserArg) process.env.DB_USER = dbUserArg.split("=")[1];
if (dbPassArg) process.env.DB_PASS = dbPassArg.split("=")[1];
if (dbHostArg) process.env.DB_HOST = dbHostArg.split("=")[1];
if (dbDialectArg) process.env.DB_DIALECT = dbDialectArg.split("=")[1];

const { JobFunction, sequelize } = require("../models");

const repoRoot = path.resolve(__dirname, "..", "..", "..");
const defaultPath = path.join(repoRoot, "data", "job-functions.json");
const inputPath = customPath ? path.resolve(customPath) : defaultPath;

const slugifyValue = (value = "") =>
    value
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 90);

const parseJson = (value, fallback = null) => {
    if (!value) return fallback;
    if (typeof value === "object") return value;
    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
};

function readJson(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
}

function normalizePayload(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.jobFunctions)) return data.jobFunctions;
    return [];
}

function sanitizeItem(item = {}) {
    const name = (item.name || "").toString().trim();
    if (!name) return null;
    const slug = slugifyValue(item.slug || name);
    const description = item.description ? item.description.toString().trim() : null;
    const parent = item.parent || item.parentSlug || item.parentName || null;
    const isFeatured = item.isFeatured === true || item.isFeatured === "true";

    return {
        name,
        slug,
        description,
        parent,
        isFeatured,
        seoTitle: item.seoTitle ? item.seoTitle.toString().trim() : null,
        seoDescription: item.seoDescription ? item.seoDescription.toString().trim() : null,
        seoKeywords: item.seoKeywords ? item.seoKeywords.toString().trim() : null,
        canonicalUrl: item.canonicalUrl ? item.canonicalUrl.toString().trim() : null,
        metaImage: item.metaImage ? item.metaImage.toString().trim() : null,
        schemaType: item.schemaType ? item.schemaType.toString().trim() : null,
        faqSchema: parseJson(item.faqSchema),
        tags: parseJson(item.tags, []),
    };
}

async function run() {
    console.log("📦 Loading job functions from:", inputPath);
    const dbName = sequelize?.config?.database;
    const dbHost = sequelize?.config?.host;
    const dbUser = sequelize?.config?.username;
    console.log("🔌 DB:", { database: dbName, host: dbHost, user: dbUser, env: process.env.NODE_ENV || "development" });

    await sequelize.authenticate();

    const raw = readJson(inputPath);
    const items = normalizePayload(raw)
        .map(sanitizeItem)
        .filter(Boolean);

    if (!items.length) {
        throw new Error("No job functions found in JSON.");
    }

    const existingRows = await JobFunction.findAll({
        attributes: ["id", "name", "slug", "parentId"],
    });
    const idBySlug = new Map(existingRows.map((row) => [row.slug, row.id]));
    const idByName = new Map(existingRows.map((row) => [row.name, row.id]));
    const existingBySlug = new Map(existingRows.map((row) => [row.slug, row]));
    const existingByName = new Map(existingRows.map((row) => [row.name, row]));

    const pending = [...items];
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let unresolved = 0;

    const resolveParentId = (parentRef) => {
        if (!parentRef) return null;
        const ref = parentRef.toString().trim();
        if (!ref) return null;
        const bySlug = idBySlug.get(slugifyValue(ref));
        if (bySlug) return bySlug;
        const byName = idByName.get(ref);
        return byName || null;
    };

    let pass = 0;
    while (pending.length) {
        pass += 1;
        let progress = 0;

        for (let i = pending.length - 1; i >= 0; i -= 1) {
            const item = pending[i];
            const parentId = resolveParentId(item.parent);
            if (item.parent && !parentId) {
                continue;
            }

            const payload = {
                name: item.name,
                slug: item.slug,
                description: item.description,
                parentId: parentId || null,
                isFeatured: item.isFeatured,
                seoTitle: item.seoTitle,
                seoDescription: item.seoDescription,
                seoKeywords: item.seoKeywords,
                canonicalUrl: item.canonicalUrl || `https://dubaijobzone.com/functions/${item.slug}`,
                metaImage: item.metaImage,
                schemaType: item.schemaType || "CategoryCode",
                faqSchema: item.faqSchema,
                tags: item.tags,
            };

            const existing = existingBySlug.get(item.slug) || existingByName.get(item.name);

            try {
                if (existing) {
                    if (onlyMissing) {
                        skipped += 1;
                    } else if (!isDryRun) {
                        await existing.update(payload);
                        updated += 1;
                    } else {
                        updated += 1;
                    }
                    idBySlug.set(item.slug, existing.id);
                    idByName.set(item.name, existing.id);
                } else {
                    if (!isDryRun) {
                        const createdRow = await JobFunction.create(payload);
                        idBySlug.set(item.slug, createdRow.id);
                        idByName.set(item.name, createdRow.id);
                    }
                    created += 1;
                }
            } catch (err) {
                console.error("❌ Upsert failed:", {
                    name: item.name,
                    slug: item.slug,
                    parent: item.parent || null,
                    message: err?.message,
                });
                throw err;
            }

            if (isVerbose) {
                console.log("✅ Upserted:", {
                    name: item.name,
                    slug: item.slug,
                    parent: item.parent || null,
                });
            }

            pending.splice(i, 1);
            progress += 1;
        }

        if (!progress) {
            unresolved = pending.length;
            break;
        }

        if (pass > items.length + 5) {
            break;
        }
    }

    console.log("✅ Done");
    console.log("Created:", created);
    console.log("Updated:", updated);
    console.log("Skipped:", skipped);
    if (unresolved) {
        console.log("Unresolved (missing parents):", unresolved);
        if (isVerbose) {
            pending.forEach((item) => {
                console.log("⚠️ Missing parent for:", item.name, "=>", item.parent);
            });
        }
    }
}

run()
    .catch((err) => {
        console.error("❌ Import failed:", err.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        try {
            await sequelize.close();
        } catch (_) {}
    });
