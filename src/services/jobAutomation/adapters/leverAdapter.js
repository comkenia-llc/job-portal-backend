'use strict';

const { cleanText } = require('../utils');

const fetch = globalThis.fetch;

const getEndpoint = (source) => {
  if (source.url) return source.url;

  const site = cleanText(source.site || source.boardName || source.boardToken);
  if (!site) {
    throw new Error(`Lever source ${source.id || source.name || ''} is missing site`);
  }

  return `https://api.lever.co/v0/postings/${encodeURIComponent(site)}?mode=json`;
};

async function leverAdapter(source) {
  const endpoint = getEndpoint(source);
  const response = await fetch(endpoint, {
    headers: {
      Accept: 'application/json,text/plain,*/*',
      'User-Agent': 'KeekanJobAutomationBot/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Lever fetch failed (${response.status}) for ${source.id || endpoint}`);
  }

  const jobs = await response.json();
  const rows = Array.isArray(jobs) ? jobs : [];

  return rows
    .map((job) => {
      const title = cleanText(job?.text || job?.title);
      const description = cleanText(job?.description || job?.descriptionPlain || '', '');
      const sourceUrl = cleanText(job?.hostedUrl || job?.applyUrl || job?.url);
      if (!title || !description || !sourceUrl) return null;

      const categories = job?.categories || {};
      const allLocations = Array.isArray(job?.categories?.allLocations) ? job.categories.allLocations : [];
      const firstAllLocation = allLocations.length ? cleanText(allLocations[0]) : null;

      return {
        title,
        description,
        sourceUrl,
        applicationUrl: cleanText(job?.applyUrl, sourceUrl),
        sourceExternalId: cleanText(job?.id || job?.requisitionCode),
        companyName: cleanText(source.companyName || source.name),
        sourceName: source.name,
        sourceType: source.sourceType,
        locationText: cleanText(
          categories?.location ||
          firstAllLocation ||
          categories?.team,
          source.locationText || source.country
        ),
        type: cleanText(categories?.commitment || source.defaultJobType, 'full-time'),
        currency: cleanText(source.currency, null),
        industry: cleanText(source.industry, null),
        sourcePostedAt: job?.createdAt || null,
        market: source.market,
        country: source.country,
        raw: job,
      };
    })
    .filter(Boolean);
}

module.exports = {
  leverAdapter,
};
