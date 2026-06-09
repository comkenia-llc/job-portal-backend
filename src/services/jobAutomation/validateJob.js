'use strict';

const { Op } = require('sequelize');
const { Company, Location } = require('../../models');
const {
  BLOCKED_SOURCE_DOMAINS,
  JOB_TYPES,
  FRESHNESS_HOURS,
} = require('./constants');
const {
  cleanText,
  hostnameFromUrl,
  hostMatches,
  normalizeUrl,
  slugifyValue,
  toDateOrNull,
} = require('./utils');

const MARKET_CONFIGS = {
  dubai: {
    market: 'dubai',
    countryCodes: ['AE'],
    countryNames: ['uae', 'united arab emirates', 'al imarat', 'dubai'],
    companyHostSuffixes: ['.ae'],
    governmentHostSuffixes: ['.gov.ae'],
    defaultCurrency: 'AED',
    defaultLocationText: 'Dubai',
    publicBaseUrl: process.env.DUBAI_PUBLIC_APP_URL || process.env.PUBLIC_APP_URL || 'https://dubaijobzone.com',
    displayCountry: 'UAE',
  },
  pk: {
    market: 'pk',
    countryCodes: ['PK'],
    countryNames: ['pakistan', 'islamic republic of pakistan'],
    companyHostSuffixes: ['.pk'],
    governmentHostSuffixes: ['.gov.pk', '.gop.pk'],
    defaultCurrency: 'PKR',
    defaultLocationText: 'Pakistan',
    publicBaseUrl: process.env.PK_PUBLIC_APP_URL || process.env.PUBLIC_APP_URL || 'https://pkjobzone.com',
    displayCountry: 'Pakistan',
  },
  uk: {
    market: 'uk',
    countryCodes: ['GB', 'UK'],
    countryNames: ['united kingdom', 'england', 'scotland', 'wales', 'northern ireland', 'great britain'],
    companyHostSuffixes: ['.uk'],
    governmentHostSuffixes: ['.gov.uk'],
    defaultCurrency: 'GBP',
    defaultLocationText: 'United Kingdom',
    publicBaseUrl: process.env.UK_PUBLIC_APP_URL || 'https://ukjobzone.com',
    displayCountry: 'United Kingdom',
  },
  saudi: {
    market: 'saudi',
    countryCodes: ['SA'],
    countryNames: ['saudi arabia', 'kingdom of saudi arabia'],
    companyHostSuffixes: ['.sa'],
    governmentHostSuffixes: ['.gov.sa'],
    defaultCurrency: 'SAR',
    defaultLocationText: 'Saudi Arabia',
    publicBaseUrl: process.env.SAUDI_PUBLIC_APP_URL || 'https://saudijobzone.com',
    displayCountry: 'Saudi Arabia',
  },
  india: {
    market: 'india',
    countryCodes: ['IN'],
    countryNames: ['india', 'bharat'],
    companyHostSuffixes: ['.in'],
    governmentHostSuffixes: ['.gov.in', '.nic.in'],
    defaultCurrency: 'INR',
    defaultLocationText: 'India',
    publicBaseUrl: process.env.INDIA_PUBLIC_APP_URL || 'https://indiajobzone.com',
    displayCountry: 'India',
  },
  australia: {
    market: 'australia',
    countryCodes: ['AU'],
    countryNames: ['australia'],
    companyHostSuffixes: ['.au'],
    governmentHostSuffixes: ['.gov.au'],
    defaultCurrency: 'AUD',
    defaultLocationText: 'Australia',
    publicBaseUrl: process.env.AUSTRALIA_PUBLIC_APP_URL || 'https://australiajobzone.com',
    displayCountry: 'Australia',
  },
  germany: {
    market: 'germany',
    countryCodes: ['DE'],
    countryNames: ['germany', 'deutschland'],
    companyHostSuffixes: ['.de'],
    governmentHostSuffixes: ['.gov.de', '.bund.de'],
    defaultCurrency: 'EUR',
    defaultLocationText: 'Germany',
    publicBaseUrl: process.env.GERMANY_PUBLIC_APP_URL || 'https://germanyjobzone.com',
    displayCountry: 'Germany',
  },
  usa: {
    market: 'usa',
    countryCodes: ['US', 'USA'],
    countryNames: ['united states', 'united states of america', 'usa'],
    companyHostSuffixes: ['.us'],
    governmentHostSuffixes: ['.gov'],
    defaultCurrency: 'USD',
    defaultLocationText: 'United States',
    publicBaseUrl: process.env.USA_PUBLIC_APP_URL || 'https://usajobzone.com',
    displayCountry: 'United States',
  },
};

const COUNTRY_TO_MARKET = Object.values(MARKET_CONFIGS).reduce((acc, config) => {
  for (const code of config.countryCodes) acc[code] = config.market;
  return acc;
}, {});

const allowlistDomains = () =>
  String(process.env.JOB_AUTOMATION_SOURCE_ALLOWLIST || '')
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);

const isBlockedSourceHost = (host) => {
  if (!host) return true;
  return BLOCKED_SOURCE_DOMAINS.some((blocked) => hostMatches(host, blocked));
};

const isAllowedHost = (host) => {
  const allow = allowlistDomains();
  if (!allow.length) return false;
  return allow.some((domain) => hostMatches(host, domain));
};

const inferMarketFromCountry = (country) => {
  const normalized = String(country || '').trim().toUpperCase();
  return COUNTRY_TO_MARKET[normalized] || null;
};

const getMarketConfig = (market) => {
  const normalized = String(market || '').trim().toLowerCase();
  return MARKET_CONFIGS[normalized] || MARKET_CONFIGS.dubai;
};

const resolveTargetMarket = (raw) => {
  const explicit = cleanText(raw.market, null)?.toLowerCase();
  if (explicit && MARKET_CONFIGS[explicit]) return explicit;

  const fromCountry = inferMarketFromCountry(raw.country);
  if (fromCountry) return fromCountry;

  const envDefault = cleanText(process.env.JOB_AUTOMATION_TARGET_MARKET, null)?.toLowerCase();
  if (envDefault && MARKET_CONFIGS[envDefault]) return envDefault;

  return 'dubai';
};

const hostMatchesSuffixes = (host, suffixes = []) => {
  if (!host) return false;
  return suffixes.some((suffix) => host === suffix.replace(/^\./, '') || host.endsWith(suffix));
};

const locationMatchesMarket = (location, config) => {
  if (!location) return false;

  if (String(location.market || '').trim().toLowerCase() === config.market) {
    return true;
  }

  const cc = String(location.countryCode || '').trim().toUpperCase();
  if (config.countryCodes.includes(cc)) return true;

  const country = String(location.country || '').trim().toLowerCase();
  if (config.countryNames.some((name) => country.includes(name))) return true;

  return false;
};

const resolveLocation = async (raw, config) => {
  if (raw.locationId) {
    const exact = await Location.findByPk(raw.locationId);
    return locationMatchesMarket(exact, config) ? exact : null;
  }

  const text = cleanText(raw.locationText);
  if (!text) return null;

  const candidates = await Location.findAll({
    where: {
      market: config.market,
      [Op.or]: [
        { name: { [Op.like]: `%${text}%` } },
        { city: { [Op.like]: `%${text}%` } },
        { state: { [Op.like]: `%${text}%` } },
        { country: { [Op.like]: `%${text}%` } },
      ],
    },
    limit: 25,
    order: [['id', 'ASC']],
  });

  return candidates.find((item) => locationMatchesMarket(item, config)) || null;
};

const resolveCompany = async (raw, config) => {
  if (raw.companyId) {
    const exact = await Company.findByPk(raw.companyId);
    return exact && String(exact.market || '').trim().toLowerCase() === config.market ? exact : null;
  }

  const sourceHost = hostnameFromUrl(raw.sourceUrl);
  if (sourceHost) {
    const companies = await Company.findAll({
      where: { market: config.market },
      attributes: ['id', 'name', 'website'],
    });
    const byDomain = companies.find((company) => {
      const companyHost = hostnameFromUrl(company.website);
      return companyHost && hostMatches(sourceHost, companyHost);
    });
    if (byDomain) {
      return Company.findByPk(byDomain.id);
    }
  }

  const companyName = cleanText(raw.companyName);
  if (companyName) {
    return Company.findOne({
      where: {
        market: config.market,
        name: { [Op.like]: companyName },
      },
    });
  }

  return null;
};

const rootUrlFromUrl = (value) => {
  const normalized = normalizeUrl(value);
  if (!normalized) return null;
  try {
    const parsed = new URL(normalized);
    return `${parsed.protocol}//${parsed.hostname}`;
  } catch {
    return null;
  }
};

const buildShellCompanyAbout = ({ name, config, locationName, industry }) => {
  const parts = [
    `${name} is an employer profile created from a verified job-source record for ${config.displayCountry}.`,
    locationName
      ? `The company is currently associated with ${locationName} for market-specific job discovery and employer browsing.`
      : `The company is currently associated with ${config.displayCountry} market coverage for job discovery and employer browsing.`,
    industry
      ? `Current source data suggests activity in ${industry}.`
      : 'Additional company details can be enriched as more structured source data becomes available.',
  ];
  return parts.join(' ');
};

const buildShellCompanySeo = ({ name, config, locationName, industry, slug }) => {
  const place = locationName || config.displayCountry;
  const sector = industry || 'career';

  return {
    seoTitle: `${name} Jobs in ${place} | ${config.displayCountry} Employer Profile`,
    seoDescription: `Explore ${name} hiring activity in ${place}. This employer page supports ${config.displayCountry} search visibility with location-linked company information and job discovery metadata for ${sector} candidates.`,
    seoKeywords: [
      `${name} jobs`,
      `${name} careers`,
      `${place} jobs`,
      `${config.displayCountry} employers`,
      `${sector} hiring`,
    ].join(', '),
    tags: [
      name,
      `${name} jobs`,
      `${name} careers`,
      `${place} employers`,
      `${config.displayCountry} hiring`,
    ],
    canonicalUrl: `${String(config.publicBaseUrl || '').replace(/\/+$/, '')}/employers/${slug}`,
  };
};

const generateUniqueCompanySlug = async (seed, market) => {
  const base = slugifyValue(seed) || `${market}-company-${Date.now()}`;
  let slug = base;
  let counter = 1;

  while (await Company.findOne({ where: { slug }, attributes: ['id'] })) {
    slug = `${base}-${market}-${counter++}`;
  }

  return slug;
};

const createShellCompany = async ({ raw, config, location, actorUserId }) => {
  const companyName = cleanText(raw.companyName);
  if (!companyName || !location || !actorUserId) {
    return null;
  }

  const slug = await generateUniqueCompanySlug(`${companyName} ${config.market}`, config.market);
  const locationName =
    location.name ||
    location.city ||
    [location.state, location.country].filter(Boolean).join(', ') ||
    config.displayCountry;
  const industry = cleanText(raw.industry, null);
  const seo = buildShellCompanySeo({
    name: companyName,
    config,
    locationName,
    industry,
    slug,
  });

  return Company.create({
    market: config.market,
    name: companyName,
    legalName: companyName,
    slug,
    industry,
    website: rootUrlFromUrl(raw.sourceUrl),
    headquarters: locationName,
    locationId: location.id,
    tagline: `${companyName} careers in ${locationName}.`,
    about: buildShellCompanyAbout({
      name: companyName,
      config,
      locationName,
      industry,
    }),
    verified: false,
    status: 'active',
    createdBy: actorUserId,
    seoTitle: seo.seoTitle,
    seoDescription: seo.seoDescription,
    seoKeywords: seo.seoKeywords,
    canonicalUrl: seo.canonicalUrl,
    metaImage: null,
    schemaType: 'Organization',
    tags: seo.tags,
  });
};

const isFreshEnough = ({ sourcePostedAt, crawlerFetchedAt, now = new Date() }) => {
  const posted = toDateOrNull(sourcePostedAt);
  const crawled = toDateOrNull(crawlerFetchedAt) || now;
  const reference = posted || crawled;
  const ageMs = now.getTime() - reference.getTime();
  return ageMs <= FRESHNESS_HOURS * 60 * 60 * 1000;
};

const SHELL_CAPTURE_PATTERNS = [
  /document\.addEventListener/i,
  /window\.[a-z0-9_]+/i,
  /\{\{[^}]+\}\}/i,
  /ng-[a-z-]+=/i,
  /data-reactroot/i,
  /forgot password/i,
  /login to earn/i,
  /search\s*&\s*book/i,
  /modify flight/i,
  /online check[\s-]?in/i,
  /newsletter subscription/i,
  /route map/i,
  /top deals/i,
  /promo code/i,
  /previous searches/i,
  /travel smart with/i,
  /select passengers/i,
  /cabin type/i,
  /departure date/i,
  /return date/i,
  /currency/i,
];

const SHELL_CAPTURE_KEYWORDS = [
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
  'login',
  'sign up',
  'apply now',
  'view more',
  'more info',
  'route map',
  'newsletter',
  'privacy policy',
  'terms and conditions',
];

const normalizeLooseText = (value = '') =>
  String(value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const stripHtmlTags = (value = '') =>
  String(value || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();

const COUNTRY_LIST_TOKENS = [
  'afghanistan',
  'pakistan',
  'india',
  'saudi arabia',
  'united arab emirates',
  'united kingdom',
  'oman',
  'qatar',
  'bahrain',
  'kuwait',
  'egypt',
  'canada',
  'australia',
];

const looksLikeCountryListDump = (normalized) => {
  const hits = COUNTRY_LIST_TOKENS.reduce(
    (count, token) => count + (normalized.includes(token) ? 1 : 0),
    0
  );
  return hits >= 6;
};

const hasLowQualityDescription = (title, description) => {
  const normalized = normalizeLooseText(stripHtmlTags(description));
  if (!normalized) return true;

  const patternHits = SHELL_CAPTURE_PATTERNS.reduce(
    (count, pattern) => count + (pattern.test(description) ? 1 : 0),
    0
  );

  const keywordHits = SHELL_CAPTURE_KEYWORDS.reduce(
    (count, keyword) => count + (normalized.includes(keyword) ? 1 : 0),
    0
  );

  const lineCount = String(description).split(/\n+/).filter(Boolean).length;
  const tokenCount = normalized.split(' ').filter(Boolean).length;
  const uniqueTokenCount = new Set(normalized.split(' ').filter(Boolean)).size;
  const titleWords = normalizeLooseText(title)
    .split(' ')
    .filter(Boolean)
    .filter((word) => word.length > 2);
  const titleWordHits = titleWords.filter((word) => normalized.includes(word)).length;
  const lexicalDiversity = tokenCount ? uniqueTokenCount / tokenCount : 0;

  if (patternHits >= 2) return true;
  if (keywordHits >= 4) return true;
  if (looksLikeCountryListDump(normalized)) return true;
  if ((patternHits >= 1 || keywordHits >= 2) && tokenCount > 180) return true;
  if ((description.includes('{{') || /window\./i.test(description)) && tokenCount > 80) return true;
  if (lineCount <= 2 && tokenCount > 220) return true;
  if (tokenCount < 35) return true;
  if (lexicalDiversity < 0.22 && tokenCount > 120) return true;
  if (titleWords.length >= 2 && titleWordHits === 0 && (patternHits >= 1 || keywordHits >= 2)) return true;

  return false;
};

const validateAndResolve = async (raw, options = {}) => {
  const config = getMarketConfig(resolveTargetMarket(raw));
  const title = cleanText(raw.title);
  const description = cleanText(raw.description);
  const sourceUrl = normalizeUrl(raw.sourceUrl);
  const sourceHost = hostnameFromUrl(sourceUrl);
  const sourceType = raw.sourceType === 'government' ? 'government' : 'company';
  const type = cleanText(raw.type, 'full-time').toLowerCase();

  if (!title || !description || !sourceUrl) {
    return { valid: false, reasonCode: 'REQUIRED_FIELDS_MISSING' };
  }
  if (hasLowQualityDescription(title, description)) {
    return { valid: false, reasonCode: 'LOW_QUALITY_DESCRIPTION' };
  }
  if (!JOB_TYPES.has(type)) {
    return { valid: false, reasonCode: 'INVALID_JOB_TYPE' };
  }
  if (!sourceHost || isBlockedSourceHost(sourceHost)) {
    return { valid: false, reasonCode: 'BLOCKED_SOURCE' };
  }

  if (sourceType === 'government') {
    if (!hostMatchesSuffixes(sourceHost, config.governmentHostSuffixes) && !isAllowedHost(sourceHost)) {
      return { valid: false, reasonCode: 'NON_TARGET_GOV_SOURCE' };
    }
  }

  if (!isFreshEnough({ sourcePostedAt: raw.sourcePostedAt, crawlerFetchedAt: raw.crawlerFetchedAt })) {
    return { valid: false, reasonCode: 'STALE_JOB' };
  }

  const location = await resolveLocation(raw, config);
  if (!location || !locationMatchesMarket(location, config)) {
    return { valid: false, reasonCode: 'NON_TARGET_LOCATION' };
  }

  let company = await resolveCompany(raw, config);

  if (sourceType === 'company') {
    if (company?.website) {
      const companyHost = hostnameFromUrl(company.website);
      if (!companyHost || !hostMatches(sourceHost, companyHost)) {
        return { valid: false, reasonCode: 'NON_COMPANY_SOURCE_DOMAIN' };
      }
    } else if (!hostMatchesSuffixes(sourceHost, config.companyHostSuffixes) && !isAllowedHost(sourceHost)) {
      return { valid: false, reasonCode: 'NON_TARGET_SOURCE_DOMAIN' };
    }

    if (!company && cleanText(raw.companyName)) {
      company = await createShellCompany({
        raw,
        config,
        location,
        actorUserId: options.actorUserId || Number(process.env.JOB_AUTOMATION_ACTOR_USER_ID || 1),
      });
    }
  }

  return {
    valid: true,
    sourceUrl,
    sourceHost,
    sourceType,
    resolved: {
      market: config.market,
      title,
      description,
      type,
      sourceUrl,
      sourceHost,
      sourceType,
      sourceName: cleanText(raw.sourceName, null),
      sourceExternalId: cleanText(raw.sourceExternalId, null),
      sourcePostedAt: toDateOrNull(raw.sourcePostedAt),
      crawlerFetchedAt: toDateOrNull(raw.crawlerFetchedAt) || new Date(),
      applicationUrl: normalizeUrl(raw.applicationUrl) || sourceUrl,
      companyName: cleanText(raw.companyName, null),
      locationText: cleanText(raw.locationText, location.name || location.city || config.defaultLocationText),
      salaryMin: Number.isFinite(Number(raw.salaryMin)) ? Number(raw.salaryMin) : null,
      salaryMax: Number.isFinite(Number(raw.salaryMax)) ? Number(raw.salaryMax) : null,
      currency: cleanText(raw.currency, config.defaultCurrency),
      industry: cleanText(raw.industry, null),
      skills: cleanText(raw.skills, null),
      deadline: toDateOrNull(raw.deadline),
      company,
      location,
      raw,
    },
  };
};

module.exports = {
  validateAndResolve,
  resolveCompany,
  resolveLocation,
};
