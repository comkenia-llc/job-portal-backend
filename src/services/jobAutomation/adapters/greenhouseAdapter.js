'use strict';

const { cleanText } = require('../utils');

const fetch = globalThis.fetch;

const getEndpoint = (source) => {
  if (source.url) {
    return source.url.includes('?') ? `${source.url}&content=true` : `${source.url}?content=true`;
  }

  const token = cleanText(source.boardToken || source.boardName);
  if (!token) {
    throw new Error(`Greenhouse source ${source.id || source.name || ''} is missing boardToken`);
  }

  return `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(token)}/jobs?content=true`;
};

async function greenhouseAdapter(source) {
  const endpoint = getEndpoint(source);
  const response = await fetch(endpoint, {
    headers: {
      Accept: 'application/json,text/plain,*/*',
      'User-Agent': 'KeekanJobAutomationBot/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Greenhouse fetch failed (${response.status}) for ${source.id || endpoint}`);
  }

  const payload = await response.json();
  const jobs = Array.isArray(payload?.jobs) ? payload.jobs : [];

  return jobs
    .map((job) => {
      const title = cleanText(job?.title);
      const description = cleanText(job?.content || job?.description || '', '');
      const sourceUrl = cleanText(job?.absolute_url || job?.job_url || job?.url);
      if (!title || !description || !sourceUrl) return null;

      const officeLocation =
        Array.isArray(job?.offices) && job.offices.length
          ? cleanText(job.offices[job.offices.length - 1]?.location || job.offices[job.offices.length - 1]?.name)
          : null;

      return {
        title,
        description,
        sourceUrl,
        applicationUrl: sourceUrl,
        sourceExternalId: cleanText(job?.internal_job_id || job?.id),
        companyName: cleanText(source.companyName || source.name),
        sourceName: source.name,
        sourceType: source.sourceType,
        locationText: cleanText(job?.location?.name || officeLocation, source.locationText || source.country),
        type: cleanText(
          job?.metadata?.employment_type ||
          job?.metadata?.type ||
          source.defaultJobType,
          'full-time'
        ),
        currency: cleanText(source.currency, null),
        industry: cleanText(source.industry, null),
        sourcePostedAt: job?.updated_at || null,
        market: source.market,
        country: source.country,
        raw: job,
      };
    })
    .filter(Boolean);
}

module.exports = {
  greenhouseAdapter,
};
