"use strict";

const { Company } = require("../models");
const { DEFAULT_MARKET, resolveRequestMarket } = require("./market");

async function getAuthenticatedCompany(req) {
    const companyId = req.user?.companyId;
    if (!companyId) return null;

    return Company.findByPk(companyId, {
        attributes: ["id", "name", "market", "createdBy"],
    });
}

async function assertEmployerMarketAccess(req) {
    const requested = resolveRequestMarket(req, {
        allowAdminOverride: false,
        fallbackMarket: DEFAULT_MARKET,
    });

    if (!req.user || req.user.role !== "employer") {
        return {
            ok: true,
            market: requested.market || DEFAULT_MARKET,
            company: null,
        };
    }

    const company = await getAuthenticatedCompany(req);
    if (!company) {
        return {
            ok: false,
            status: 400,
            error: "Employer account is not linked to a company",
        };
    }

    const companyMarket = company.market || DEFAULT_MARKET;
    const requestMarket = requested.market || companyMarket;

    if (requestMarket && companyMarket && requestMarket !== companyMarket) {
        return {
            ok: false,
            status: 403,
            error: "This employer can only manage content for its assigned portal market",
        };
    }

    return {
        ok: true,
        market: companyMarket,
        company,
    };
}

module.exports = {
    getAuthenticatedCompany,
    assertEmployerMarketAccess,
};
