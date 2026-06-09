'use strict';

const { loadSources } = require('./sourceRegistry');
const { genericJsonAdapter } = require('./adapters/genericJsonAdapter');
const { greenhouseAdapter } = require('./adapters/greenhouseAdapter');
const { ashbyAdapter } = require('./adapters/ashbyAdapter');
const { leverAdapter } = require('./adapters/leverAdapter');
const { htmlScrapeAdapter } = require('./adapters/htmlScrapeAdapter');
const { discoverCompanyJobs } = require('./autoDiscovery');

const ADAPTERS = {
  'generic-json': genericJsonAdapter,
  greenhouse: greenhouseAdapter,
  ashby: ashbyAdapter,
  lever: leverAdapter,
  'html-scrape': htmlScrapeAdapter,
};

const fetchRawJobsFromSources = async () => {
  const sources = loadSources().filter((source) => source.enabled);
  const result = {
    sourcesChecked: sources.length,
    sourceErrors: [],
    jobs: [],
  };

  for (const source of sources) {
    const adapter = ADAPTERS[source.adapter];
    if (!adapter) {
      result.sourceErrors.push({ source: source.id, error: `Unknown adapter: ${source.adapter}` });
      continue;
    }

    try {
      const items = await adapter(source);
      result.jobs.push(
        ...items.map((item) => ({
          ...item,
          sourceId: source.id,
          sourceName: item.sourceName || source.name,
          sourceType: item.sourceType || source.sourceType,
          market: item.market || source.market || null,
          country: item.country || source.country || null,
          currency: item.currency || source.currency || null,
        }))
      );
    } catch (error) {
      result.sourceErrors.push({ source: source.id, error: error.message });
    }
  }

  const shouldAutoDiscover =
    String(process.env.JOB_AUTOMATION_AUTO_DISCOVERY || '').toLowerCase() === 'true' ||
    sources.length === 0;

  if (shouldAutoDiscover) {
    try {
      const discovered = await discoverCompanyJobs({
        market: process.env.JOB_AUTOMATION_TARGET_MARKET || process.env.DEFAULT_MARKET || 'dubai',
      });

      result.jobs.push(...discovered.jobs);
      result.sourceErrors.push(
        ...discovered.errors.map((entry) => ({
          source: `auto-discovery:${entry.companyId}`,
          error: entry.error,
        }))
      );
    } catch (error) {
      result.sourceErrors.push({ source: 'auto-discovery', error: error.message });
    }
  }

  return result;
};

module.exports = {
  fetchRawJobsFromSources,
};
