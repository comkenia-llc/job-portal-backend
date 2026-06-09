'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_SOURCES_PATH = path.resolve(__dirname, '../../data/jobAutomationSources.json');

const COUNTRY_TO_MARKET = {
  AE: 'dubai',
  PK: 'pk',
  GB: 'uk',
  UK: 'uk',
  SA: 'saudi',
  IN: 'india',
  AU: 'australia',
  DE: 'germany',
  US: 'usa',
  USA: 'usa',
};

const COUNTRY_TO_CURRENCY = {
  AE: 'AED',
  PK: 'PKR',
  GB: 'GBP',
  UK: 'GBP',
  SA: 'SAR',
  IN: 'INR',
  AU: 'AUD',
  DE: 'EUR',
  US: 'USD',
  USA: 'USD',
};

const parseSourcesFromEnv = () => {
  const raw = process.env.JOB_AUTOMATION_SOURCES_JSON;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const parseSourcesFromFile = () => {
  const customPath = process.env.JOB_AUTOMATION_SOURCES_FILE;
  const sourcePath = customPath
    ? path.resolve(process.cwd(), customPath)
    : DEFAULT_SOURCES_PATH;

  if (!fs.existsSync(sourcePath)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const loadSources = () => {
  const envSources = parseSourcesFromEnv();
  const fileSources = parseSourcesFromFile();
  const merged = (envSources && envSources.length ? envSources : fileSources)
    .map((source) => {
      const country = String(source.country || 'AE').trim().toUpperCase();
      return {
        ...source,
        country,
        id: source.id || source.url || source.boardToken || source.boardName || source.site,
        name: source.name || source.id || source.url || source.boardToken || source.boardName || source.site,
        sourceType: source.sourceType === 'government' ? 'government' : 'company',
        adapter: source.adapter || 'generic-json',
        url: source.url || null,
        enabled: source.enabled === undefined ? true : Boolean(source.enabled),
        market: String(
          source.market ||
          COUNTRY_TO_MARKET[country] ||
          'dubai'
        )
          .trim()
          .toLowerCase(),
        currency: String(
          source.currency ||
          COUNTRY_TO_CURRENCY[country] ||
          'AED'
        )
          .trim()
          .toUpperCase(),
        locationText: source.locationText || null,
      };
    })
    .filter((source) => source.url || source.boardToken || source.boardName || source.site);

  return merged;
};

module.exports = {
  loadSources,
};
