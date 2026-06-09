'use strict';

const crypto = require('crypto');
const { URL } = require('url');

const cleanText = (value, fallback = null) => {
  if (value === undefined || value === null) return fallback;
  const text = String(value).trim();
  return text ? text : fallback;
};

const normalizeUrl = (value) => {
  const raw = cleanText(value);
  if (!raw) return null;
  try {
    const parsed = new URL(raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`);
    parsed.hash = '';
    const params = new URLSearchParams(parsed.search);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'].forEach((key) => {
      params.delete(key);
    });
    const qs = params.toString();
    parsed.search = qs ? `?${qs}` : '';
    if (parsed.pathname.length > 1 && parsed.pathname.endsWith('/')) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }
    return parsed.toString();
  } catch {
    return null;
  }
};

const hostnameFromUrl = (value) => {
  const normalized = normalizeUrl(value);
  if (!normalized) return null;
  try {
    return new URL(normalized).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
};

const hostMatches = (left, right) => {
  if (!left || !right) return false;
  return left === right || left.endsWith(`.${right}`) || right.endsWith(`.${left}`);
};

const sha256 = (value) => crypto.createHash('sha256').update(String(value || '')).digest('hex');

const slugifyValue = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);

const toDateOrNull = (value) => {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const utcDayStart = (date = new Date()) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));

module.exports = {
  cleanText,
  normalizeUrl,
  hostnameFromUrl,
  hostMatches,
  sha256,
  slugifyValue,
  toDateOrNull,
  utcDayStart,
};
