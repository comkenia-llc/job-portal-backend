"use strict";

const { attachMarketScope } = require("../utils/market");

module.exports = {
    marketMiddleware: attachMarketScope,
};
