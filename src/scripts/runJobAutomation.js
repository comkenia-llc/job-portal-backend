'use strict';

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { sequelize } = require('../models');
const { runJobAutomation } = require('../services/jobAutomation/runAutomation');

const arg = (name, fallback = null) => {
  const pref = `--${name}=`;
  const found = process.argv.find((a) => a.startsWith(pref));
  return found ? found.slice(pref.length) : fallback;
};

const parseJobsFile = (filePath) => {
  if (!filePath) return null;
  const abs = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(abs)) throw new Error(`Input file does not exist: ${abs}`);
  const parsed = JSON.parse(fs.readFileSync(abs, 'utf8'));
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed.jobs)) return parsed.jobs;
  throw new Error('Input JSON must be an array or object with jobs[]');
};

async function run() {
  const actorUserId = Number(arg('user-id', process.env.JOB_AUTOMATION_ACTOR_USER_ID || 1));
  const maxPerDay = Number(arg('max-per-day', process.env.JOB_AUTOMATION_MAX_PER_DAY || 100));
  const dryRun = arg('dry-run', 'false') === 'true';
  const file = arg('file', null);

  const rawJobs = parseJobsFile(file);

  const report = await runJobAutomation({
    actorUserId,
    maxPerDay,
    rawJobs,
    dryRun,
  });

  console.log(JSON.stringify(report, null, 2));
}

run()
  .catch((error) => {
    console.error('❌ runJobAutomation failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
