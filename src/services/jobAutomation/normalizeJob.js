'use strict';

const { cleanText } = require('./utils');

const MARKET_DEFAULTS = {
  dubai: { locationText: 'Dubai', currency: 'AED' },
  pk: { locationText: 'Pakistan', currency: 'PKR' },
  uk: { locationText: 'United Kingdom', currency: 'GBP' },
  saudi: { locationText: 'Saudi Arabia', currency: 'SAR' },
  india: { locationText: 'India', currency: 'INR' },
  australia: { locationText: 'Australia', currency: 'AUD' },
  germany: { locationText: 'Germany', currency: 'EUR' },
  usa: { locationText: 'United States', currency: 'USD' },
};

const normalizeRawJob = (raw) => {
  const market = cleanText(raw.market, null)?.toLowerCase() || 'dubai';
  const defaults = MARKET_DEFAULTS[market] || MARKET_DEFAULTS.dubai;

  return {
    title: cleanText(raw.title),
    description: cleanText(raw.description, ''),
    sourceUrl: cleanText(raw.sourceUrl),
    sourceExternalId: cleanText(raw.sourceExternalId),
    sourceType: raw.sourceType === 'government' ? 'government' : 'company',
    sourceName: cleanText(raw.sourceName),
    sourcePostedAt: raw.sourcePostedAt || null,
    crawlerFetchedAt: raw.crawlerFetchedAt || new Date().toISOString(),
    companyId: raw.companyId || null,
    companyName: cleanText(raw.companyName),
    locationId: raw.locationId || null,
    locationText: cleanText(raw.locationText, defaults.locationText),
    type: cleanText(raw.type, 'full-time'),
    salaryMin: raw.salaryMin,
    salaryMax: raw.salaryMax,
    currency: cleanText(raw.currency, defaults.currency),
    industry: cleanText(raw.industry),
    skills: cleanText(raw.skills),
    deadline: raw.deadline || null,
    applicationUrl: cleanText(raw.applicationUrl) || cleanText(raw.sourceUrl),
    market,
    country: cleanText(raw.country, null)?.toUpperCase() || null,
    raw,
  };
};

module.exports = {
  normalizeRawJob,
};
