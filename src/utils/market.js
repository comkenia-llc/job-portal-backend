"use strict";

const { Op } = require("sequelize");

const MARKET_ALL = "all";
const DEFAULT_MARKET = normalizeMarketKey(process.env.DEFAULT_MARKET || "global");

const BASE_MARKET_DOMAIN_MAP = {
    dubai: ["dubaijobzone", "dubaijobzone.com"],
    uk: ["ukjobzone", "ukjobzone.com"],
    usa: ["usajobzone", "usajobzone.com"],
    pk: ["pkjobzone", "pkjobzone.com"],
    india: ["indiajobzone", "indiajobzone.com"],
    saudi: ["saudijobzone", "saudijobzone.com"],
    germany: ["germanyjobzone", "germanyjobzone.com"],
    australia: ["australiajobzone", "australiajobzone.com"],
};

function normalizeMarketKey(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "");
}

function normalizeHost(value) {
    if (!value) return "";
    const raw = String(value).trim();
    if (!raw) return "";

    try {
        const withProtocol = /^[a-z]+:\/\//i.test(raw) ? raw : `https://${raw}`;
        return new URL(withProtocol).hostname.toLowerCase().replace(/^www\./, "");
    } catch {
        return raw
            .replace(/^[a-z]+:\/\//i, "")
            .split("/")[0]
            .split(":")[0]
            .toLowerCase()
            .replace(/^www\./, "");
    }
}

function parseExplicitOrigins() {
    return String(process.env.CORS_ALLOWED_ORIGINS || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
}

function parseConfiguredMarketMap() {
    const raw = String(process.env.MARKET_DOMAIN_MAP || "").trim();
    if (!raw) return {};

    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        const output = {};
        raw.split(";").forEach((pair) => {
            const [market, hostsRaw] = pair.split("=");
            const key = normalizeMarketKey(market);
            if (!key || !hostsRaw) return;
            output[key] = hostsRaw
                .split(",")
                .map((host) => host.trim())
                .filter(Boolean);
        });
        return output;
    }
}

function buildMarketDomainMap() {
    const configured = parseConfiguredMarketMap();
    const entries = { ...BASE_MARKET_DOMAIN_MAP };

    Object.entries(configured).forEach(([market, hosts]) => {
        const key = normalizeMarketKey(market);
        if (!key) return;
        const values = Array.isArray(hosts) ? hosts : [hosts];
        entries[key] = [...(entries[key] || []), ...values];
    });

    return Object.fromEntries(
        Object.entries(entries).map(([market, hosts]) => [
            market,
            [...new Set(hosts.map((host) => normalizeHost(host)).filter(Boolean))],
        ])
    );
}

const MARKET_DOMAIN_MAP = buildMarketDomainMap();
const ALLOWED_LOCAL_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:4004",
];

function getAllAllowedOrigins() {
    const origins = new Set([...ALLOWED_LOCAL_ORIGINS, ...parseExplicitOrigins()]);

    Object.values(MARKET_DOMAIN_MAP).forEach((hosts) => {
        hosts.forEach((host) => {
            origins.add(`https://${host}`);
            origins.add(`http://${host}`);
        });
    });

    return [...origins];
}

function resolveMarketFromHost(host) {
    const normalized = normalizeHost(host);
    if (!normalized) return null;

    for (const [market, aliases] of Object.entries(MARKET_DOMAIN_MAP)) {
        if (aliases.some((alias) => normalized === alias || normalized.endsWith(`.${alias}`))) {
            return market;
        }
    }

    return null;
}

function extractRequestHosts(req) {
    const values = [];
    const push = (value) => {
        if (!value) return;
        String(value)
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
            .forEach((item) => values.push(item));
    };

    push(req.headers.origin);
    push(req.headers.referer);
    push(req.headers["x-forwarded-host"]);
    push(req.headers.host);

    return values
        .map((value) => normalizeHost(value))
        .filter(Boolean);
}

function isAllowedOrigin(origin) {
    if (!origin) return true;
    const normalizedHost = normalizeHost(origin);
    if (!normalizedHost) return false;

    const explicitOrigins = new Set(getAllAllowedOrigins());
    if (explicitOrigins.has(origin)) return true;
    if (normalizedHost === "localhost" || normalizedHost === "127.0.0.1") return true;

    return Boolean(resolveMarketFromHost(normalizedHost));
}

function resolveRequestMarket(req, options = {}) {
    const {
        allowAdminOverride = false,
        allowExplicitOverride = false,
        allowAllForAdmin = false,
        fallbackMarket = DEFAULT_MARKET,
    } = options;

    const isAdmin = req.user?.role === "admin";
    const rawOverride =
        req.query?.market ?? req.body?.market ?? req.headers["x-market"] ?? req.marketContext?.market;
    const override = normalizeMarketKey(rawOverride);

    if (allowAdminOverride && isAdmin && override) {
        if (allowAllForAdmin && override === MARKET_ALL) {
            return { market: null, source: "admin-all", host: null };
        }
        return { market: override, source: "admin-override", host: null };
    }

    if (allowExplicitOverride && override) {
        return { market: override, source: "explicit-override", host: null };
    }

    const hosts = extractRequestHosts(req);
    for (const host of hosts) {
        const market = resolveMarketFromHost(host);
        if (market) {
            return { market, source: "request-host", host };
        }
    }

    return { market: fallbackMarket || null, source: "default", host: null };
}

function attachMarketScope(req, _res, next) {
    req.marketContext = resolveRequestMarket(req);
    next();
}

function applyMarketScope(where, req, options = {}) {
    const resolved = resolveRequestMarket(req, options);
    if (resolved.market) {
        where.market = resolved.market;
    }
    return where;
}

function assignMarketToPayload(payload, req, options = {}) {
    const target = payload || {};
    const resolved = resolveRequestMarket(req, options);
    const requestedMarket = normalizeMarketKey(target.market);
    const isAdmin = req.user?.role === "admin";

    if (options.allowAdminOverride && isAdmin && requestedMarket) {
        target.market = requestedMarket;
        return target;
    }

    target.market = resolved.market || DEFAULT_MARKET;
    return target;
}

function buildMarketCountWhere(req, foreignKey, ids, options = {}) {
    const where = { [foreignKey]: ids };
    return applyMarketScope(where, req, options);
}

function buildOptionalMarketClause(req, options = {}) {
    const resolved = resolveRequestMarket(req, options);
    if (!resolved.market) return null;
    return { market: resolved.market };
}

module.exports = {
    MARKET_ALL,
    DEFAULT_MARKET,
    MARKET_DOMAIN_MAP,
    Op,
    normalizeHost,
    normalizeMarketKey,
    resolveMarketFromHost,
    resolveRequestMarket,
    isAllowedOrigin,
    getAllAllowedOrigins,
    attachMarketScope,
    applyMarketScope,
    assignMarketToPayload,
    buildMarketCountWhere,
    buildOptionalMarketClause,
};
