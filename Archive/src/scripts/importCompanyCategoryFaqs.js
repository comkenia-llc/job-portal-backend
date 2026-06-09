'use strict';

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const args = new Set(process.argv.slice(2));
const isDryRun = args.has('--dry-run');
const onlyMissing = args.has('--only-missing');
const isVerbose = args.has('--verbose');
const matchArg = process.argv.find((arg) => arg.startsWith('--match='));
const matchMode = matchArg ? matchArg.split('=')[1] : 'slug';

const fileArg = process.argv.find((arg) => arg.startsWith('--file='));
const customPath = fileArg ? fileArg.split('=')[1] : null;

const dbNameArg = process.argv.find((arg) => arg.startsWith('--db-name='));
const dbUserArg = process.argv.find((arg) => arg.startsWith('--db-user='));
const dbPassArg = process.argv.find((arg) => arg.startsWith('--db-pass='));
const dbHostArg = process.argv.find((arg) => arg.startsWith('--db-host='));
const dbDialectArg = process.argv.find((arg) => arg.startsWith('--db-dialect='));

if (dbNameArg) process.env.DB_NAME = dbNameArg.split('=')[1];
if (dbUserArg) process.env.DB_USER = dbUserArg.split('=')[1];
if (dbPassArg) process.env.DB_PASS = dbPassArg.split('=')[1];
if (dbHostArg) process.env.DB_HOST = dbHostArg.split('=')[1];
if (dbDialectArg) process.env.DB_DIALECT = dbDialectArg.split('=')[1];

const { CompanyCategory, sequelize } = require('../models');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const defaultPath = path.join(repoRoot, 'data', 'company-category-faqs.json');
const inputPath = customPath ? path.resolve(customPath) : defaultPath;

function readJson(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
}

function normalizePayload(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.companyCategories)) return data.companyCategories;
    return [];
}

function parseFaqs(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch (_) {
            return [];
        }
    }
    return [];
}

function mergeFaqs(existing, incoming) {
    const seen = new Set();
    const out = [];

    const push = (item) => {
        const q = (item?.q || '').toString().trim();
        const a = (item?.a || '').toString().trim();
        if (!q || !a) return;
        const key = `${q.toLowerCase()}|${a.toLowerCase()}`;
        if (seen.has(key)) return;
        seen.add(key);
        out.push({ q, a });
    };

    existing.forEach(push);
    incoming.forEach(push);
    return out;
}

async function run() {
    console.log('📦 Loading FAQs from:', inputPath);
    const dbName = sequelize?.config?.database;
    const dbHost = sequelize?.config?.host;
    const dbUser = sequelize?.config?.username;
    console.log('🔌 DB:', { database: dbName, host: dbHost, user: dbUser, env: process.env.NODE_ENV || 'development' });
    await sequelize.authenticate();
    const totalCategories = await CompanyCategory.count();
    console.log('📊 CompanyCategories count:', totalCategories);
    if (!totalCategories) {
        throw new Error(
            `No CompanyCategories found in DB "${dbName}". Check DB_NAME/DB_USER in back/.env or pass --db-name/--db-user.`
        );
    }
    const data = readJson(inputPath);
    const items = normalizePayload(data);

    if (!items.length) {
        throw new Error('No company categories found in JSON.');
    }

    let updated = 0;
    let skipped = 0;
    let missing = 0;

    for (const item of items) {
        const id = item.id;
        const slug = item.slug;
        const faqs = Array.isArray(item.faqs) ? item.faqs : [];

        if (!faqs.length) {
            skipped++;
            continue;
        }

        let where = null;
        if (matchMode === 'id') {
            where = Number.isFinite(id) ? { id } : null;
        } else if (matchMode === 'slug') {
            where = slug ? { slug } : null;
        } else if (matchMode === 'slug-or-id') {
            where = slug ? { slug } : (Number.isFinite(id) ? { id } : null);
        } else {
            where = slug ? { slug } : (Number.isFinite(id) ? { id } : null);
        }
        if (!where) {
            skipped++;
            continue;
        }

        const category = await CompanyCategory.findOne({ where });
        if (!category) {
            if (isVerbose) {
                console.log('⚠️ Missing category for', where);
            }
            missing++;
            continue;
        }

        if (onlyMissing && category.faqs) {
            if (isVerbose) {
                console.log('⏭️ Skipping (already has faqs):', { id: category.id, slug: category.slug });
            }
            skipped++;
            continue;
        }

        const existingFaqs = parseFaqs(category.faqs);
        const mergedFaqs = mergeFaqs(existingFaqs, faqs);

        if (!isDryRun) {
            await category.update({ faqs: JSON.stringify(mergedFaqs) });
        }
        if (isVerbose) {
            console.log('✅ Updated:', {
                id: category.id,
                slug: category.slug,
                added: Math.max(0, mergedFaqs.length - existingFaqs.length),
                total: mergedFaqs.length,
            });
        }
        updated++;
    }

    console.log('✅ Done');
    console.log('Updated:', updated);
    console.log('Skipped:', skipped);
    console.log('Missing:', missing);
}

run()
    .catch((err) => {
        console.error('❌ Import failed:', err.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        try {
            await sequelize.close();
        } catch (_) {}
    });
