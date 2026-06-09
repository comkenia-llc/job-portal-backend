'use strict';

const { cleanText } = require('../utils');

const fetch = globalThis.fetch;

const getEndpoint = (source) => {
  if (source.url) return source.url;

  const boardName = cleanText(source.boardName || source.boardToken);
  if (!boardName) {
    throw new Error(`Ashby source ${source.id || source.name || ''} is missing boardName`);
  }

  return `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(boardName)}`;
};

async function ashbyAdapter(source) {
  const endpoint = getEndpoint(source);
  const response = await fetch(endpoint, {
    headers: {
      Accept: 'application/json,text/plain,*/*',
      'User-Agent': 'KeekanJobAutomationBot/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Ashby fetch failed (${response.status}) for ${source.id || endpoint}`);
  }

  const payload = await response.json();
  const jobs = Array.isArray(payload?.jobs) ? payload.jobs : [];

  return jobs
    .map((job) => {
      const title = cleanText(job?.title);
      const description = cleanText(job?.descriptionHtml || job?.description || '', '');
      const sourceUrl = cleanText(job?.jobUrl || job?.url);
      if (!title || !description || !sourceUrl) return null;

      const secondaryLocations = Array.isArray(job?.secondaryLocations) ? job.secondaryLocations : [];
      const secondaryLocation = secondaryLocations.length
        ? cleanText(secondaryLocations[0]?.location || secondaryLocations[0]?.address?.addressLocality)
        : null;

      return {
        title,
        description,
        sourceUrl,
        applicationUrl: sourceUrl,
        sourceExternalId: cleanText(job?.id || job?.jobId || job?.slug),
        companyName: cleanText(source.companyName || source.name),
        sourceName: source.name,
        sourceType: source.sourceType,
        locationText: cleanText(job?.location || secondaryLocation, source.locationText || source.country),
        type: cleanText(job?.employmentType || source.defaultJobType, 'full-time'),
        currency: cleanText(job?.compensation?.currencyCode || source.currency, null),
        industry: cleanText(source.industry, null),
        sourcePostedAt: job?.publishedDate || job?.updatedAt || null,
        market: source.market,
        country: source.country,
        raw: job,
      };
    })
    .filter(Boolean);
}

module.exports = {
  ashbyAdapter,
};
