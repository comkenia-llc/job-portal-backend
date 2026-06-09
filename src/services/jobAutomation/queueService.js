'use strict';

const { JobIngestionQueue } = require('../../models');

const queueForAdmin = async ({ reasonCode, resolved, keys }) => {
  const item = await JobIngestionQueue.create({
    status: 'pending',
    reasonCode,
    sourceType: resolved.sourceType,
    sourceName: resolved.sourceName,
    sourceUrl: resolved.sourceUrl,
    sourceCanonicalUrl: keys.canonical,
    sourceHost: resolved.sourceHost,
    sourceExternalId: resolved.sourceExternalId,
    sourcePostedAt: resolved.sourcePostedAt,
    crawlerFetchedAt: resolved.crawlerFetchedAt,
    title: resolved.title,
    description: resolved.description,
    type: resolved.type,
    locationText: resolved.locationText,
    companyName: resolved.companyName,
    applicationUrl: resolved.applicationUrl,
    payload: resolved.raw || {},
    contentFingerprint: keys.contentFingerprint,
    dedupeKey: keys.dedupeKey,
    companyId: resolved.company?.id || null,
    locationId: resolved.location?.id || null,
  });

  return item;
};

module.exports = {
  queueForAdmin,
};
