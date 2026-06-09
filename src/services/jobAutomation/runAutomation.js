'use strict';

const { Op } = require('sequelize');
const { JobDedupFingerprint } = require('../../models');
const { DEFAULT_DAILY_LIMIT } = require('./constants');
const { utcDayStart } = require('./utils');
const { fetchRawJobsFromSources } = require('./fetchSources');
const { normalizeRawJob } = require('./normalizeJob');
const { validateAndResolve } = require('./validateJob');
const { buildKeys, isDuplicate, saveFingerprint } = require('./dedupeService');
const { queueForAdmin } = require('./queueService');

const getTodayProcessedCount = async () => {
  const start = utcDayStart();
  return JobDedupFingerprint.count({
    where: {
      status: { [Op.in]: ['published', 'queued'] },
      createdAt: { [Op.gte]: start },
      sourceType: { [Op.in]: ['company', 'government'] },
    },
  });
};

const runJobAutomation = async ({ actorUserId, maxPerDay, rawJobs = null, dryRun = false }) => {
  const dailyLimit = Number.isFinite(Number(maxPerDay)) && Number(maxPerDay) > 0
    ? Number(maxPerDay)
    : DEFAULT_DAILY_LIMIT;

  const alreadyProcessedToday = await getTodayProcessedCount();
  const remainingSlots = Math.max(0, dailyLimit - alreadyProcessedToday);

  const sourceFetch = rawJobs
    ? { sourcesChecked: 0, sourceErrors: [], jobs: rawJobs }
    : await fetchRawJobsFromSources();

  const report = {
    dailyLimit,
    alreadyProcessedToday,
    remainingSlots,
    crawled: sourceFetch.jobs.length,
    published: 0,
    queuedForAdmin: 0,
    duplicatesBlocked: 0,
    rejected: 0,
    sourceErrors: sourceFetch.sourceErrors,
    reasons: {},
    queueIds: [],
    publishedJobIds: [],
  };

  if (!remainingSlots) {
    report.reasons.DAILY_LIMIT_REACHED = sourceFetch.jobs.length;
    report.rejected = sourceFetch.jobs.length;
    return report;
  }

  for (const raw of sourceFetch.jobs) {
    const normalized = normalizeRawJob(raw);
    const validated = await validateAndResolve(normalized, { actorUserId });

    if (!validated.valid) {
      report.rejected += 1;
      report.reasons[validated.reasonCode] = (report.reasons[validated.reasonCode] || 0) + 1;
      continue;
    }

    const { resolved } = validated;
    const keys = buildKeys({
      sourceUrl: resolved.sourceUrl,
      sourceHost: resolved.sourceHost,
      sourceExternalId: resolved.sourceExternalId,
      title: resolved.title,
      companyId: resolved.company?.id,
      companyName: resolved.companyName,
      locationId: resolved.location?.id,
      type: resolved.type,
    });

    const duplicate = await isDuplicate(keys);
    if (duplicate.duplicate) {
      report.duplicatesBlocked += 1;
      report.reasons[duplicate.reasonCode] = (report.reasons[duplicate.reasonCode] || 0) + 1;
      continue;
    }

    if (!resolved.company?.id) {
      if (!dryRun) {
        const queueItem = await queueForAdmin({ reasonCode: 'COMPANY_NOT_FOUND', resolved, keys });
        await saveFingerprint({
          keys,
          sourceType: resolved.sourceType,
          status: 'queued',
          locationId: resolved.location?.id,
          queueId: queueItem.id,
          meta: { pipeline: 'automation', reasonCode: 'COMPANY_NOT_FOUND' },
        });
        report.queueIds.push(queueItem.id);
      }

      report.queuedForAdmin += 1;
      report.reasons.COMPANY_NOT_FOUND = (report.reasons.COMPANY_NOT_FOUND || 0) + 1;
      continue;
    }

    if (report.queuedForAdmin >= remainingSlots) {
      report.rejected += 1;
      report.reasons.DAILY_LIMIT_REACHED = (report.reasons.DAILY_LIMIT_REACHED || 0) + 1;
      continue;
    }

    if (dryRun) {
      report.queuedForAdmin += 1;
      report.reasons.AWAITING_EDITOR_REVIEW = (report.reasons.AWAITING_EDITOR_REVIEW || 0) + 1;
      continue;
    }

    const queueItem = await queueForAdmin({
      reasonCode: 'AWAITING_EDITOR_REVIEW',
      resolved,
      keys,
    });
    await saveFingerprint({
      keys,
      sourceType: resolved.sourceType,
      status: 'queued',
      companyId: resolved.company.id,
      locationId: resolved.location?.id,
      queueId: queueItem.id,
      meta: { pipeline: 'automation', reasonCode: 'AWAITING_EDITOR_REVIEW' },
    });

    report.queuedForAdmin += 1;
    report.queueIds.push(queueItem.id);
    report.reasons.AWAITING_EDITOR_REVIEW = (report.reasons.AWAITING_EDITOR_REVIEW || 0) + 1;
  }

  return report;
};

module.exports = {
  runJobAutomation,
};
