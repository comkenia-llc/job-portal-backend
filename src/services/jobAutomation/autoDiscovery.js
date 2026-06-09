'use strict';

const cheerio = require('cheerio');
const { Op } = require('sequelize');
const { Company } = require('../../models');
const { cleanText, hostnameFromUrl, normalizeUrl, hostMatches } = require('./utils');

const fetch = globalThis.fetch;

const USER_AGENT = 'KeekanJobAutomationBot/1.0';
const CAREERS_PATHS = [
  '/careers',
  '/jobs',
  '/careers/jobs',
  '/careers/job-openings',
  '/join-us',
  '/work-with-us',
  '/vacancies',
  '/open-positions',
  '/career-opportunities',
  '/opportunities',
];

const MARKET_DEFAULTS = {
  dubai: { country: 'AE', currency: 'AED', locationText: 'Dubai' },
  pk: { country: 'PK', currency: 'PKR', locationText: 'Pakistan' },
  uk: { country: 'GB', currency: 'GBP', locationText: 'United Kingdom' },
  saudi: { country: 'SA', currency: 'SAR', locationText: 'Saudi Arabia' },
  india: { country: 'IN', currency: 'INR', locationText: 'India' },
  australia: { country: 'AU', currency: 'AUD', locationText: 'Australia' },
  germany: { country: 'DE', currency: 'EUR', locationText: 'Germany' },
  usa: { country: 'US', currency: 'USD', locationText: 'United States' },
};

const JOB_PATH_KEYWORDS = [
  '/job',
  '/jobs',
  '/career',
  '/careers',
  '/vacanc',
  '/opening',
  '/opportunit',
  '/position',
  '/recruit',
  '/hiring',
];

const NOISE_LINK_TEXT = new Set([
  'home',
  'about',
  'about us',
  'contact',
  'contact us',
  'login',
  'log in',
  'sign in',
  'register',
  'privacy',
  'terms',
  'blog',
  'news',
  'learn more',
  'read more',
  'view all',
]);

const NOISE_TITLE_PATTERNS = [
  /^careers?$/i,
  /^jobs?$/i,
  /^vacancies$/i,
  /^open positions?$/i,
  /^opportunities$/i,
  /^join us$/i,
  /^work with us$/i,
  /^career opportunities$/i,
];

const getMarketDefaults = (market) => MARKET_DEFAULTS[market] || MARKET_DEFAULTS.dubai;

const uniq = (values) => Array.from(new Set(values.filter(Boolean)));

const buildCandidateUrls = (website) => {
  const normalized = normalizeUrl(website);
  if (!normalized) return [];
  try {
    const base = new URL(normalized);
    const root = `${base.protocol}//${base.hostname}`;
    return uniq([root, ...CAREERS_PATHS.map((pathname) => `${root}${pathname}`)]);
  } catch {
    return [];
  }
};

const fetchHtml = async (url) => {
  const response = await fetch(url, {
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
      'User-Agent': USER_AGENT,
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Fetch failed (${response.status})`);
  }

  const contentType = String(response.headers.get('content-type') || '').toLowerCase();
  if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
    throw new Error(`Unsupported content type: ${contentType || 'unknown'}`);
  }

  return response.text();
};

const absolutizeUrl = (value, baseUrl) => {
  const normalized = cleanText(value, null);
  if (!normalized) return null;
  try {
    return new URL(normalized, baseUrl).toString();
  } catch {
    return null;
  }
};

const isSamePageOrAnchorOnly = (href, pageUrl) => {
  try {
    const target = new URL(href);
    const page = new URL(pageUrl);

    const normalizedTargetPath = target.pathname.replace(/\/+$/, '') || '/';
    const normalizedPagePath = page.pathname.replace(/\/+$/, '') || '/';
    const sameBase =
      target.origin === page.origin &&
      normalizedTargetPath === normalizedPagePath &&
      String(target.search || '') === String(page.search || '');

    if (sameBase && target.hash) return true;
    if (sameBase && (normalizedTargetPath === '/' || normalizedTargetPath === '')) return true;
    return false;
  } catch {
    return false;
  }
};

const normalizeTitle = (value, companyName = '') => {
  const raw = cleanText(value, null);
  if (!raw) return null;

  let normalized = raw
    .replace(/\s+/g, ' ')
    .replace(/\s*[|•·]\s*.+$/, '')
    .replace(/\s*[-–—]\s*(careers?|jobs?|vacancies|join us|work with us).*/i, '')
    .trim();

  const company = cleanText(companyName, null);
  if (company) {
    const escapedCompany = company.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    normalized = normalized
      .replace(new RegExp(`\\s*[-–—|:]\\s*${escapedCompany}$`, 'i'), '')
      .replace(new RegExp(`^${escapedCompany}\\s*[-–—|:]\\s*`, 'i'), '')
      .trim();
  }

  return cleanText(normalized, null);
};

const isBadTitle = (title, companyName = '') => {
  const normalized = normalizeTitle(title, companyName);
  const company = cleanText(companyName, null);

  if (!normalized) return true;
  if (normalized.length < 4 || normalized.length > 160) return true;
  if (NOISE_TITLE_PATTERNS.some((pattern) => pattern.test(normalized))) return true;

  if (company) {
    const titleLower = normalized.toLowerCase();
    const companyLower = company.toLowerCase();
    if (titleLower === companyLower) return true;
    if (titleLower === `${companyLower} careers`) return true;
    if (titleLower === `${companyLower} jobs`) return true;
  }

  return false;
};

const looksLikeCareersPage = ($, pageUrl) => {
  const bodyText = $('body').text().toLowerCase();
  if (
    bodyText.includes('career') ||
    bodyText.includes('open positions') ||
    bodyText.includes('job openings') ||
    pageUrl.toLowerCase().includes('/careers') ||
    pageUrl.toLowerCase().includes('/jobs')
  ) {
    return true;
  }

  return $('a[href]').toArray().some((element) => {
    const href = String($(element).attr('href') || '').toLowerCase();
    return JOB_PATH_KEYWORDS.some((keyword) => href.includes(keyword));
  });
};

const extractJsonLdObjects = ($) => {
  const scripts = $('script[type="application/ld+json"]').toArray();
  const items = [];

  for (const script of scripts) {
    const raw = cleanText($(script).html(), null);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        items.push(...parsed);
      } else {
        items.push(parsed);
      }
    } catch {
      continue;
    }
  }

  return items.filter(Boolean);
};

const firstJsonLdJobPosting = ($) =>
  extractJsonLdObjects($).find((item) => {
    const type = item?.['@type'];
    if (Array.isArray(type)) {
      return type.some((entry) => String(entry).toLowerCase() === 'jobposting');
    }
    return String(type || '').toLowerCase() === 'jobposting';
  }) || null;

const extractLocationFromJobPosting = (jobPosting) => {
  if (!jobPosting) return null;

  const locations = Array.isArray(jobPosting.jobLocation)
    ? jobPosting.jobLocation
    : jobPosting.jobLocation
      ? [jobPosting.jobLocation]
      : [];

  for (const location of locations) {
    const address = location?.address || {};
    const value = cleanText(
      [
        address.addressLocality,
        address.addressRegion,
        address.addressCountry,
      ]
        .filter(Boolean)
        .join(', '),
      null
    );
    if (value) return value;
  }

  return cleanText(jobPosting.jobLocationType, null);
};

const jobLinkCandidates = ($, pageUrl) => {
  const pageHost = hostnameFromUrl(pageUrl);

  return $('a[href]')
    .toArray()
    .map((element) => {
      const href = absolutizeUrl($(element).attr('href'), pageUrl);
      const text = cleanText($(element).text(), null);
      if (!href || !text) return null;
      if (isSamePageOrAnchorOnly(href, pageUrl)) return null;

      const host = hostnameFromUrl(href);
      if (!host || !pageHost || !hostMatches(host, pageHost)) return null;

      const textLower = text.toLowerCase();
      if (NOISE_LINK_TEXT.has(textLower)) return null;
      if (text.length < 4 || text.length > 140) return null;

      const urlLower = href.toLowerCase();
      const isJobish = JOB_PATH_KEYWORDS.some((keyword) => urlLower.includes(keyword));
      if (!isJobish && !/(engineer|manager|executive|specialist|developer|analyst|designer|officer|assistant|lead|intern|coordinator)/i.test(text)) {
        return null;
      }

      return { href, text };
    })
    .filter(Boolean);
};

const buildRawJobFromDetailPage = async ({ url, company, marketDefaults, market }) => {
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  const jobPosting = firstJsonLdJobPosting($);

  const title = normalizeTitle(
    jobPosting?.title ||
    $('h1').first().text() ||
    $('title').first().text(),
    company.name
  );

  const description = cleanText(
    jobPosting?.description ||
    $('main').text() ||
    $('article').text() ||
    $('.job-description').first().text() ||
    $('.description').first().text(),
    null
  );

  if (isBadTitle(title, company.name) || !description || description.length < 140) {
    return null;
  }

  const locationText = cleanText(
    extractLocationFromJobPosting(jobPosting) ||
    $('[class*="location"]').first().text() ||
    company.headquarters ||
    marketDefaults.locationText,
    marketDefaults.locationText
  );

  const datePublished = cleanText(
    jobPosting?.datePosted ||
    $('time[datetime]').first().attr('datetime') ||
    null,
    null
  );

  const employmentType = cleanText(
    Array.isArray(jobPosting?.employmentType) ? jobPosting.employmentType[0] : jobPosting?.employmentType,
    'full-time'
  );

  return {
    title,
    description,
    sourceUrl: url,
    applicationUrl: url,
    sourceExternalId: url,
    sourceType: 'company',
    sourceName: company.name,
    companyName: company.name,
    companyId: company.id,
    locationText,
    type: employmentType.toLowerCase().includes('part') ? 'part-time' : 'full-time',
    currency: marketDefaults.currency,
    industry: company.industry || null,
    sourcePostedAt: datePublished,
    crawlerFetchedAt: new Date().toISOString(),
    market,
    country: marketDefaults.country,
    raw: {
      discoveredFrom: company.website,
    },
  };
};

const scrapeCompanyJobs = async ({ company, market, marketDefaults, maxJobsPerCompany }) => {
  const candidatePages = buildCandidateUrls(company.website);
  const jobUrls = new Set();

  for (const candidatePage of candidatePages) {
    try {
      const html = await fetchHtml(candidatePage);
      const $ = cheerio.load(html);

      if (!looksLikeCareersPage($, candidatePage)) {
        continue;
      }

      const directJobPosting = firstJsonLdJobPosting($);
      if (directJobPosting && !isBadTitle(directJobPosting.title, company.name)) {
        jobUrls.add(candidatePage);
      }

      for (const link of jobLinkCandidates($, candidatePage)) {
        jobUrls.add(link.href);
        if (jobUrls.size >= maxJobsPerCompany) break;
      }

      if (jobUrls.size >= maxJobsPerCompany) break;
    } catch {
      continue;
    }
  }

  const jobs = [];
  for (const url of jobUrls) {
    if (jobs.length >= maxJobsPerCompany) break;
    try {
      const rawJob = await buildRawJobFromDetailPage({
        url,
        company,
        marketDefaults,
        market,
      });
      if (rawJob) jobs.push(rawJob);
    } catch {
      continue;
    }
  }

  return jobs;
};

const discoverCompanyJobs = async ({ market }) => {
  const targetMarket = cleanText(market, null)?.toLowerCase() || cleanText(process.env.JOB_AUTOMATION_TARGET_MARKET, null)?.toLowerCase() || 'dubai';
  const marketDefaults = getMarketDefaults(targetMarket);
  const companyLimit = Number(process.env.JOB_AUTOMATION_AUTO_DISCOVERY_COMPANY_LIMIT || 50);
  const maxJobsPerCompany = Number(process.env.JOB_AUTOMATION_AUTO_DISCOVERY_MAX_JOBS_PER_COMPANY || 10);

  const companies = await Company.findAll({
    where: {
      market: targetMarket,
      status: 'active',
      website: {
        [Op.ne]: null,
      },
    },
    attributes: ['id', 'name', 'market', 'website', 'industry', 'headquarters'],
    limit: companyLimit,
    order: [['id', 'ASC']],
    raw: true,
  });

  const jobs = [];
  const errors = [];

  for (const company of companies) {
    try {
      const discovered = await scrapeCompanyJobs({
        company,
        market: targetMarket,
        marketDefaults,
        maxJobsPerCompany,
      });
      jobs.push(...discovered);
    } catch (error) {
      errors.push({ companyId: company.id, company: company.name, error: error.message });
    }
  }

  return {
    jobs,
    companiesChecked: companies.length,
    errors,
  };
};

module.exports = {
  discoverCompanyJobs,
};
