'use strict';

const { cleanText } = require('../utils');

const toArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.jobs)) return data.jobs;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const extract = (item, keys, fallback = null) => {
  for (const key of keys) {
    const value = item?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value;
    }
  }
  return fallback;
};

async function genericJsonAdapter(source) {
  const response = await fetch(source.url, {
    headers: {
      Accept: 'application/json,text/plain,*/*',
      'User-Agent': 'KeekanJobAutomationBot/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Source fetch failed (${response.status}) for ${source.id || source.url}`);
  }

  const payload = await response.json();
  const rows = toArray(payload);

  return rows
    .map((item) => {
      const title = cleanText(extract(item, ['title', 'jobTitle', 'name']));
      const description = cleanText(extract(item, ['description', 'jobDescription', 'details']), '');
      const sourceUrl = cleanText(extract(item, ['sourceUrl', 'url', 'jobUrl', 'link']));
      const locationText = cleanText(
        extract(item, ['location', 'locationText', 'city', 'address']),
        source.locationText || source.market || source.country || 'UAE'
      );

      if (!title || !description || !sourceUrl) return null;

      return {
        title,
        description,
        sourceUrl,
        sourceExternalId: cleanText(extract(item, ['sourceExternalId', 'externalId', 'id'])),
        applicationUrl: cleanText(extract(item, ['applicationUrl', 'applyUrl', 'applyLink']), sourceUrl),
        companyName: cleanText(extract(item, ['companyName', 'company', 'employer']), source.name),
        sourceName: source.name,
        sourceType: source.sourceType,
        locationText,
        locationId: extract(item, ['locationId'], null),
        companyId: extract(item, ['companyId'], null),
        type: cleanText(extract(item, ['type', 'employmentType']), 'full-time'),
        salaryMin: extract(item, ['salaryMin', 'minSalary'], null),
        salaryMax: extract(item, ['salaryMax', 'maxSalary'], null),
        currency: cleanText(extract(item, ['currency']), source.currency || 'AED'),
        industry: cleanText(extract(item, ['industry']), null),
        skills: cleanText(extract(item, ['skills']), null),
        deadline: extract(item, ['deadline', 'expiryDate'], null),
        sourcePostedAt: extract(item, ['sourcePostedAt', 'postedAt', 'publishedAt', 'datePosted'], null),
        crawlerFetchedAt: new Date().toISOString(),
        market: cleanText(extract(item, ['market']), source.market || null),
        country: cleanText(extract(item, ['country', 'countryCode']), source.country || null),
        raw: item,
      };
    })
    .filter(Boolean);
}

module.exports = {
  genericJsonAdapter,
};
