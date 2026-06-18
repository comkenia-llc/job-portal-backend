"use strict";

const MARKET_CURRENCY_MAP = {
    dubai: "AED",
    pk: "PKR",
    uk: "GBP",
    saudi: "SAR",
    india: "INR",
    australia: "AUD",
    germany: "EUR",
    usa: "USD",
    global: "USD",
};

const MARKET_LABEL_MAP = {
    dubai: "Dubai",
    pk: "Pakistan",
    uk: "United Kingdom",
    saudi: "Saudi Arabia",
    india: "India",
    australia: "Australia",
    germany: "Germany",
    usa: "United States",
    global: "Global",
};

const getCurrencyForMarket = (market = "global") =>
    MARKET_CURRENCY_MAP[String(market || "global").trim().toLowerCase()] || "USD";

const getLabelForMarket = (market = "global") =>
    MARKET_LABEL_MAP[String(market || "global").trim().toLowerCase()] || "Global";

module.exports = {
    MARKET_CURRENCY_MAP,
    MARKET_LABEL_MAP,
    getCurrencyForMarket,
    getLabelForMarket,
};
