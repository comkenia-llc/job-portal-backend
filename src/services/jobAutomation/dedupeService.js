'use strict';

const { Op } = require('sequelize');
const { Job, JobDedupFingerprint, JobIngestionQueue } = require('../../models');
const { sha256, cleanText, normalizeUrl } = require('./utils');

const buildKeys = ({ sourceUrl, sourceHost, sourceExternalId, title, companyId, companyName, locationId, type }) => {
  const canonical = normalizeUrl(sourceUrl);
  const sourceUrlHash = sha256(canonical || '');
  const external = cleanText(sourceExternalId, null);
  const companyKey = companyId || cleanText(companyName, 'unknown-company');
  const contentFingerprint = sha256(
    [cleanText(title, ''), String(companyKey), String(locationId || ''), cleanText(type, '')]
      .join('|')
      .toLowerCase()
  );

  return {
    canonical,
    sourceUrlHash,
    sourceHost: cleanText(sourceHost, null),
    sourceExternalId: external,
    contentFingerprint,
    dedupeKey: sha256(`${sourceUrlHash}|${contentFingerprint}|${external || ''}`),
  };
};

const isDuplicate = async (keys) => {
  if (!keys?.canonical || !keys?.sourceUrlHash || !keys?.contentFingerprint) {
    return { duplicate: true, reasonCode: 'INVALID_DEDUPE_KEY' };
  }

  const [byUrlHash, byContent, byJobUrl, byQueueKey] = await Promise.all([
    JobDedupFingerprint.findOne({ where: { sourceUrlHash: keys.sourceUrlHash }, attributes: ['id'] }),
    JobDedupFingerprint.findOne({ where: { contentFingerprint: keys.contentFingerprint }, attributes: ['id'] }),
    Job.findOne({ where: { applicationUrl: keys.canonical }, attributes: ['id'] }),
    JobIngestionQueue.findOne({ where: { dedupeKey: keys.dedupeKey }, attributes: ['id'] }),
  ]);

  if (byUrlHash || byJobUrl) return { duplicate: true, reasonCode: 'DUPLICATE_SOURCE_URL' };
  if (byContent) return { duplicate: true, reasonCode: 'DUPLICATE_FINGERPRINT' };
  if (byQueueKey) return { duplicate: true, reasonCode: 'DUPLICATE_PENDING_QUEUE' };

  if (keys.sourceExternalId && keys.sourceHost) {
    const byExternal = await JobDedupFingerprint.findOne({
      where: {
        sourceHost: keys.sourceHost,
        sourceExternalId: keys.sourceExternalId,
      },
      attributes: ['id'],
    });
    if (byExternal) return { duplicate: true, reasonCode: 'DUPLICATE_EXTERNAL_ID' };
  }

  return { duplicate: false };
};

const saveFingerprint = async ({ keys, sourceType, status, companyId = null, locationId = null, jobId = null, queueId = null, meta = null }) => {
  return JobDedupFingerprint.create({
    sourceCanonicalUrl: keys.canonical,
    sourceUrlHash: keys.sourceUrlHash,
    sourceExternalId: keys.sourceExternalId,
    sourceHost: keys.sourceHost,
    contentFingerprint: keys.contentFingerprint,
    companyId,
    locationId,
    sourceType,
    status,
    jobId,
    queueId,
    meta,
  });
};

module.exports = {
  buildKeys,
  isDuplicate,
  saveFingerprint,
};
