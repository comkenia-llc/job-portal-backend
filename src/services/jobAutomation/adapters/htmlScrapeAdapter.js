'use strict';

const cheerio = require('cheerio');
const { cleanText } = require('../utils');

const fetch = globalThis.fetch;

const USER_AGENT = 'KeekanJobAutomationBot/1.0';

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null) return [];
  return [value];
};

const firstNonEmpty = (...values) => {
  for (const value of values) {
    const text = cleanText(value, null);
    if (text) return text;
  }
  return null;
};

const STRIP_SELECTORS = [
  'script',
  'style',
  'noscript',
  'svg',
  'iframe',
  'canvas',
  'form',
  'header',
  'footer',
  'nav',
  'aside',
  '[aria-hidden="true"]',
  '[hidden]',
  '.header',
  '.footer',
  '.nav',
  '.navbar',
  '.site-header',
  '.site-footer',
  '.breadcrumbs',
  '.breadcrumb',
  '.social-share',
  '.share',
  '.newsletter',
  '.cookie',
  '.cookies',
  '.related-jobs',
  '.similar-jobs',
  '.recommended-jobs',
  '.job-list',
  '.jobs-list',
  '.search-form',
  '.login',
  '.signup',
];

const SHELL_HINTS = [
  'book flight',
  'modify flight',
  'online check-in',
  'online check in',
  'flight status',
  'newsletter subscription',
  'route map',
  'top deals',
  'promo code',
  'previous searches',
  'forgot password',
  'sign up',
  'login',
  'document.addEventListener',
  'window.',
  '{{',
];

const absolutizeUrl = (value, baseUrl) => {
  const raw = cleanText(value, null);
  if (!raw) return null;
  try {
    return new URL(raw, baseUrl).toString();
  } catch {
    return null;
  }
};

const fetchHtml = async (url) => {
  const response = await fetch(url, {
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
      'User-Agent': USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`HTML scrape fetch failed (${response.status}) for ${url}`);
  }

  return response.text();
};

const pickText = ($scope, selectors = []) => {
  for (const selector of toArray(selectors)) {
    if (!selector) continue;
    const text = cleanText($scope.find(selector).first().text(), null);
    if (text) return text;
  }
  return null;
};

const pickAttr = ($scope, selectors = [], attr = 'href') => {
  for (const selector of toArray(selectors)) {
    if (!selector) continue;
    const value = cleanText($scope.find(selector).first().attr(attr), null);
    if (value) return value;
  }
  return null;
};

const pickOwnAttr = ($scope, attrs = []) => {
  for (const attr of toArray(attrs)) {
    if (!attr) continue;
    const value = cleanText($scope.attr(attr), null);
    if (value) return value;
  }
  return null;
};

const extractJsonLdDescription = ($) => {
  const scripts = $('script[type="application/ld+json"]').toArray();
  for (const script of scripts) {
    const raw = cleanText($(script).html(), null);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      const objects = Array.isArray(parsed) ? parsed : [parsed];
      for (const object of objects) {
        if (!object) continue;
        const type = Array.isArray(object['@type']) ? object['@type'].join(',') : object['@type'];
        if (String(type || '').toLowerCase().includes('jobposting')) {
          const desc = cleanText(object.description, null);
          if (desc) return desc;
        }
      }
    } catch {
      continue;
    }
  }
  return null;
};

const cleanNodeForDescription = ($root) => {
  if (!$root || !$root.length) return null;
  const $clone = cheerio.load(`<div id="root">${$root.first().html() || ''}</div>`);
  STRIP_SELECTORS.forEach((selector) => {
    $clone(selector).remove();
  });
  const text = cleanText($clone('#root').text().replace(/\s+/g, ' '), null);
  return text;
};

const scoreDescription = (text) => {
  const normalized = String(text || '').toLowerCase();
  if (!normalized) return -1;
  const words = normalized.split(/\s+/).filter(Boolean);
  const shellHits = SHELL_HINTS.reduce((count, hint) => count + (normalized.includes(hint) ? 1 : 0), 0);
  const bulletish = (text.match(/[\n\r]|•|- /g) || []).length;
  return words.length + bulletish * 8 - shellHits * 40;
};

const candidateDescriptionSelectors = (source) => [
  ...(toArray(source.detailDescriptionSelector)),
  ...(toArray(source.descriptionSelector)),
  'article',
  'main',
  '[role="main"]',
  '.job-description',
  '.jobDescription',
  '.description',
  '.job-details',
  '.job-detail',
  '.details',
  '.content',
  '.job-content',
  '.career-detail',
];

const extractBestDescription = ($, selectors) => {
  const candidates = [];

  for (const selector of selectors) {
    if (!selector) continue;
    $(selector).each((_, node) => {
      const cleaned = cleanNodeForDescription($(node));
      if (!cleaned) return;
      candidates.push({
        text: cleaned,
        score: scoreDescription(cleaned),
      });
    });
  }

  const jsonLd = extractJsonLdDescription($);
  if (jsonLd) {
    candidates.push({
      text: jsonLd,
      score: scoreDescription(jsonLd) + 15,
    });
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.text || null;
};

async function htmlScrapeAdapter(source) {
  if (!source.url) {
    throw new Error(`html-scrape source ${source.id || source.name || ''} is missing url`);
  }
  if (!source.listItemSelector) {
    throw new Error(`html-scrape source ${source.id || source.name || ''} is missing listItemSelector`);
  }

  const listingHtml = await fetchHtml(source.url);
  const $ = cheerio.load(listingHtml);
  const items = $(source.listItemSelector).toArray();

  const results = [];

  for (const element of items) {
    const $item = $(element);

    const title = firstNonEmpty(
      pickText($item, source.titleSelector),
      cleanText($item.attr('title'), null)
    );

    const rawLink = firstNonEmpty(
      pickAttr($item, source.linkSelector, 'href'),
      pickOwnAttr($item, ['href', 'data-href', 'data-url'])
    );
    const sourceUrl = absolutizeUrl(rawLink, source.url);

    if (!title || !sourceUrl) continue;

    const locationText = firstNonEmpty(
      pickText($item, source.locationSelector),
      source.locationText,
      source.country
    );

    const sourceExternalId = firstNonEmpty(
      pickOwnAttr($item, ['data-id', 'data-job-id', 'data-post-id']),
      sourceUrl
    );

    let description = firstNonEmpty(pickText($item, source.descriptionSelector), null);

    if (source.fetchDetailPage !== false) {
      try {
        const detailHtml = await fetchHtml(sourceUrl);
        const $$ = cheerio.load(detailHtml);
        description = firstNonEmpty(
          extractBestDescription($$, candidateDescriptionSelectors(source)),
          description
        );
      } catch {
        // Keep listing description fallback if detail fetch fails.
      }
    }

    if (!description) continue;

    results.push({
      title,
      description,
      sourceUrl,
      applicationUrl: sourceUrl,
      sourceExternalId,
      companyName: cleanText(source.companyName || source.name),
      sourceName: source.name,
      sourceType: source.sourceType,
      locationText,
      locationId: null,
      companyId: null,
      type: cleanText(source.defaultJobType, 'full-time'),
      salaryMin: null,
      salaryMax: null,
      currency: cleanText(source.currency, null),
      industry: cleanText(source.industry, null),
      skills: null,
      deadline: null,
      sourcePostedAt: null,
      crawlerFetchedAt: new Date().toISOString(),
      market: source.market,
      country: source.country,
      raw: {
        listingUrl: source.url,
      },
    });
  }

  return results;
}

module.exports = {
  htmlScrapeAdapter,
};
