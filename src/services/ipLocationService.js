"use strict";

const axios = require("axios");

const LOCATION_CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const REQUEST_TIMEOUT_MS = Number(process.env.IP_LOCATION_TIMEOUT_MS || 4000);
const locationCache = new Map();

const formatLocation = ({ city = "", region = "", country = "" } = {}) =>
    [city, region, country]
        .map((value) => String(value || "").trim())
        .filter(Boolean)
        .join(", ");

const getCachedLocation = (ipAddress) => {
    const entry = locationCache.get(ipAddress);
    if (!entry) return "";
    if (entry.expiresAt < Date.now()) {
        locationCache.delete(ipAddress);
        return "";
    }
    return entry.value;
};

const setCachedLocation = (ipAddress, value) => {
    if (!ipAddress || !value) return;
    locationCache.set(ipAddress, {
        value,
        expiresAt: Date.now() + LOCATION_CACHE_TTL_MS,
    });
};

const readIpwhoisLocation = async (ipAddress) => {
    const { data } = await axios.get(`https://ipwho.is/${encodeURIComponent(ipAddress)}`, {
        timeout: REQUEST_TIMEOUT_MS,
        validateStatus: (status) => status >= 200 && status < 500,
    });

    if (!data || data.success === false) {
        return "";
    }

    return formatLocation({
        city: data.city,
        region: data.region,
        country: data.country,
    });
};

const readIpapiLocation = async (ipAddress) => {
    const { data } = await axios.get(`https://ipapi.co/${encodeURIComponent(ipAddress)}/json/`, {
        timeout: REQUEST_TIMEOUT_MS,
        validateStatus: (status) => status >= 200 && status < 500,
    });

    if (!data || data.error) {
        return "";
    }

    return formatLocation({
        city: data.city,
        region: data.region,
        country: data.country_name || data.country,
    });
};

const resolveIpLocation = async (ipAddress) => {
    if (!ipAddress) {
        return "";
    }

    const cachedValue = getCachedLocation(ipAddress);
    if (cachedValue) {
        return cachedValue;
    }

    const providers = [readIpwhoisLocation, readIpapiLocation];

    for (const provider of providers) {
        try {
            const location = await provider(ipAddress);
            if (location) {
                setCachedLocation(ipAddress, location);
                return location;
            }
        } catch {
            // Try the next provider.
        }
    }

    return "";
};

module.exports = {
    resolveIpLocation,
};
