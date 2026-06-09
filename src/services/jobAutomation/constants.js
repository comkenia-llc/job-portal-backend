'use strict';

const BLOCKED_SOURCE_DOMAINS = [
  'indeed.com',
  'linkedin.com',
  'glassdoor.com',
  'bayt.com',
  'gulftalent.com',
  'naukrigulf.com',
  'monster.com',
  'jooble.org',
  'careerjet.com',
  'simplyhired.com',
  'dubizzle.com',
  'rozee.pk',
];

const UAE_COUNTRY_NAMES = [
  'uae',
  'united arab emirates',
  'al imarat',
];

const JOB_TYPES = new Set(['full-time', 'part-time', 'contract', 'internship', 'temporary', 'remote']);

const DEFAULT_DAILY_LIMIT = 100;
const FRESHNESS_HOURS = 72;

module.exports = {
  BLOCKED_SOURCE_DOMAINS,
  UAE_COUNTRY_NAMES,
  JOB_TYPES,
  DEFAULT_DAILY_LIMIT,
  FRESHNESS_HOURS,
};
