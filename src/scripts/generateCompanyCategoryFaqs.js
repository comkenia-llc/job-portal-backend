'use strict';

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

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
const outputPath = path.join(repoRoot, 'data', 'company-category-faqs.json');

function makeFaqs(name) {
    const lower = name.toLowerCase();
    return [
        {
            q: `How to find ${lower} companies in Dubai?`,
            a: `Start with category listings and filter by location, size, and hiring status. Dubai employers often show active roles on their company pages, so review recent vacancies and requirements. Shortlist companies that match your experience and industry focus.`,
        },
        {
            q: `Which ${lower} companies are hiring in Dubai?`,
            a: `Hiring changes quickly, so check updated listings and company profiles regularly. Large groups and fast‑growing firms usually post roles most often. Compare openings to see who is actively recruiting right now.`,
        },
        {
            q: `What jobs are common in ${lower} companies?`,
            a: `Roles vary by company size but often include operations, sales, customer service, and specialist positions related to the sector. Senior roles focus on strategy and leadership, while junior roles emphasize execution and support. Review multiple listings to see the most frequent titles.`,
        },
        {
            q: `How to apply to ${lower} companies in UAE?`,
            a: `Prepare a targeted CV and highlight outcomes relevant to the sector. Apply through official company pages or trusted job portals, and follow up if you meet the requirements. Tailoring your application to the job description improves response rates.`,
        },
        {
            q: `Are ${lower} companies good for freshers in Dubai?`,
            a: `Many companies offer entry‑level roles or trainee programs, especially in growing sectors. Strong communication skills, basic certifications, and internships can help freshers stand out. Focus on roles that list junior or graduate requirements.`,
        },
        {
            q: `What skills do ${lower} companies look for?`,
            a: `Companies look for sector‑specific knowledge plus teamwork, communication, and problem‑solving. Practical experience or internships carry weight, especially when tied to measurable results. Show tools or systems you’ve used that are common in the industry.`,
        },
        {
            q: `What is the salary range in ${lower} companies in Dubai?`,
            a: `Salaries depend on role level, company size, and specialization. Some listings include ranges, while others request expectations. Compare multiple roles to estimate market rates and factor in benefits like housing or transport allowances.`,
        },
        {
            q: `How to get interviews with ${lower} companies?`,
            a: `Use a focused CV, keep your profile updated, and apply early to active roles. Highlight achievements that match the company’s needs, not just responsibilities. Networking and referrals can also improve interview chances.`,
        },
        {
            q: `What are the requirements to work in ${lower} companies in Dubai?`,
            a: `Requirements vary by role, but most employers expect relevant experience, education, and clear documentation. Some roles may require licenses or approvals. Always check visa, shift, and compliance details in the listing.`,
        },
        {
            q: `How to apply for ${lower} companies on Dubai Job Zone?`,
            a: `Search the category, filter by location and role, and apply directly from the listing. Keep your CV updated and track applications in one place. Dubai Job Zone helps you compare companies quickly before you apply.`,
        },
    ];
}

async function run() {
    const dbName = sequelize?.config?.database;
    const dbHost = sequelize?.config?.host;
    const dbUser = sequelize?.config?.username;
    console.log('🔌 DB:', { database: dbName, host: dbHost, user: dbUser, env: process.env.NODE_ENV || 'development' });
    await sequelize.authenticate();
    const categories = await CompanyCategory.findAll({
        order: [['name', 'ASC']],
    });

    const payload = categories.map((cat) => ({
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        parentId: cat.parentId ?? null,
        faqs: makeFaqs(cat.name),
    }));

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify({ companyCategories: payload }, null, 2));
    console.log(`Wrote ${payload.length} categories to ${outputPath}`);
}

run()
    .catch((err) => {
        console.error('❌ Generate failed:', err.message || err);
        if (err && err.stack) console.error(err.stack);
        process.exitCode = 1;
    })
    .finally(async () => {
        try {
            await sequelize.close();
        } catch (_) {}
    });
