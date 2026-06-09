const { Location, Job, Company } = require("../models");
const path = require("path");
const fs = require("fs");
const { Op, Sequelize } = require("sequelize");
const { applyMarketScope, assignMarketToPayload } = require("../utils/market");

// ====================================================
// 🗂️ Helper — Move uploaded file
// ====================================================
const moveFile = (file, folder = "locations") => {
    if (!file) return null;
    try {
        const uploadsDir = path.join(__dirname, "../uploads", folder);
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

        const dest = path.join(uploadsDir, file.filename);
        fs.renameSync(file.path, dest);
        return `/uploads/${folder}/${file.filename}`;
    } catch (err) {
        console.error(`❌ moveFile error (${folder}):`, err);
        return `/uploads/${file.filename}`;
    }
};

const toFloat = (value) => {
    if (value === "" || value === undefined || value === null) return null;
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? null : parsed;
};

const normalizeJSON = (value) => {
    if (!value) return null;
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
        try {
            return JSON.parse(value);
        } catch {
            return value
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean);
        }
    }
    return value;
};

const buildDisplayName = (loc) => {
    if (!loc) return "Untitled Location";
    const parts = [];
    const normalized = (value) => (typeof value === "string" ? value.trim() : "");

    const name = normalized(loc.name);
    const city = normalized(loc.city);
    const state = normalized(loc.state);
    const country = normalized(loc.country);

    if (name && name !== city && name !== state && name !== country) {
        parts.push(name);
    }
    if (city) parts.push(city);
    if (state && state !== city) parts.push(state);
    if (country && country !== state && country !== city) parts.push(country);

    if (parts.length > 0) {
        return parts.join(", ");
    }
    return "Untitled Location";
};

const serializeLocation = (loc) => ({
    ...loc.toJSON(),
    displayName: buildDisplayName(loc),
});

const isLocalDevHost = (req) => {
    const host = String(req.get("host") || req.headers.host || "").toLowerCase();
    return (
        host.includes("localhost") ||
        host.includes("127.0.0.1") ||
        host.includes("0.0.0.0")
    );
};

const getAncestorTrail = async (location, req) => {
    const trail = [];
    let currentParentId = location?.parentId || null;

    while (currentParentId) {
        const parent = await Location.findOne({
            where: applyMarketScope({ id: currentParentId }, req, {
                allowAdminOverride: true,
                allowExplicitOverride: true,
                allowAllForAdmin: true,
            }),
            attributes: ["id", "name", "slug", "type", "parentId", "country", "state", "city"],
        });
        if (!parent) break;
        trail.unshift(serializeLocation(parent));
        currentParentId = parent.parentId || null;
    }

    return trail;
};

// ====================================================
// 🏗️ Create Location
// ====================================================
exports.createLocation = async (req, res) => {
    try {
        const data = {
            ...req.body,
            country: req.body.country?.trim() || null,
            countryCode: req.body.countryCode?.trim() || null,
            state: req.body.state?.trim() || null,
            city: req.body.city?.trim() || null,
            continent: req.body.continent?.trim() || null,
            timezone: req.body.timezone?.trim() || null,
            currency: req.body.currency?.trim() || "USD",
            slug: req.body.slug?.trim() || null,
            affordabilityTier: req.body.affordabilityTier?.trim() || null,
        };
        assignMarketToPayload(data, req, { allowAdminOverride: true });

        data.latitude = toFloat(req.body.latitude);
        data.longitude = toFloat(req.body.longitude);
        data.rentMultiplier = toFloat(req.body.rentMultiplier);
        data.tags = normalizeJSON(req.body.tags);

        if (req.body.faqSchema) {
            try {
                data.faqSchema =
                    typeof req.body.faqSchema === "string"
                        ? JSON.parse(req.body.faqSchema)
                        : req.body.faqSchema;
            } catch {
                console.warn("⚠️ Invalid faqSchema JSON, skipping");
            }
        }

        // 📂 Move files
        if (req.files?.flag?.[0]) data.flag = moveFile(req.files.flag[0], "flags");
        if (req.files?.image?.[0]) data.image = moveFile(req.files.image[0], "locations");
        if (req.files?.metaImage?.[0]) data.metaImage = moveFile(req.files.metaImage[0], "locations");

        if (!data.type) data.type = "country";
        data.parentId = req.body.parentId ? parseInt(req.body.parentId, 10) || null : null;

        if (!data.name) {
            data.name = buildDisplayName(data);
        }

        const location = await Location.create(data);

        console.log("✅ Location created:", location.toJSON());
        res.status(201).json(serializeLocation(location));
    } catch (err) {
        console.error("❌ createLocation error:", err);
        res.status(500).json({ message: "Failed to create location" });
    }
};


// ====================================================
// 🌍 Get All Locations (with hierarchy & counts)
// ====================================================
exports.getAllLocations = async (req, res) => {
    try {
        const { type, parentId, isFeatured, search, city, limit = 50, page = 1 } = req.query;
        const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const offset = (pageNum - 1) * limitNum;
        const where = applyMarketScope({}, req, {
            allowAdminOverride: true,
            allowExplicitOverride: true,
            allowAllForAdmin: true,
        });

        if (type && type !== "all") where.type = type;
        if (parentId !== undefined) where.parentId = parentId === "null" ? null : parseInt(parentId, 10);
        if (city) {
            where.city = { [Op.like]: `%${city}%` };
        }
        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { country: { [Op.like]: `%${search}%` } },
                { state: { [Op.like]: `%${search}%` } },
                { city: { [Op.like]: `%${search}%` } },
                { slug: { [Op.like]: `%${search}%` } },
            ];
        }

        const { rows, count } = await Location.findAndCountAll({
            where,
            limit: limitNum,
            offset,
            order: [["name", "ASC"]],

        });

        // === Count related jobs & companies ===
        const jobCounts = await Job.findAll({
            where: applyMarketScope({}, req, {
                allowAdminOverride: true,
                allowExplicitOverride: true,
                allowAllForAdmin: true,
            }),
            attributes: [
                "locationId",
                [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
            ],
            group: ["locationId"],
            raw: true,
        });

        const companyCounts = await Company.findAll({
            where: applyMarketScope({}, req, {
                allowAdminOverride: true,
                allowExplicitOverride: true,
                allowAllForAdmin: true,
            }),
            attributes: [
                "locationId",
                [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
            ],
            group: ["locationId"],
            raw: true,
        });

        const jobMap = Object.fromEntries(jobCounts.map((r) => [r.locationId, parseInt(r.count)]));
        const companyMap = Object.fromEntries(companyCounts.map((r) => [r.locationId, parseInt(r.count)]));
        const childCounts = await Location.findAll({
            where: applyMarketScope({
                parentId: { [Op.ne]: null },
            }, req, {
                allowAdminOverride: true,
                allowExplicitOverride: true,
                allowAllForAdmin: true,
            }),
            attributes: [
                "parentId",
                [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
            ],
            group: ["parentId"],
            raw: true,
        });
        const childMap = Object.fromEntries(
            childCounts.map((r) => [r.parentId, parseInt(r.count, 10)])
        );

        const enriched = rows.map((loc) => {
            const json = serializeLocation(loc);
            return {
                ...json,
                jobCount: jobMap[loc.id] || 0,
                companyCount: companyMap[loc.id] || 0,
                childCount: childMap[loc.id] || 0,
            };
        });

        if (req.query.sort === "jobs") {
            enriched.sort((a, b) => (b.jobCount || 0) - (a.jobCount || 0));
        }

        res.json({
            total: count,
            page: pageNum,
            totalPages: Math.ceil(count / limitNum),
            items: enriched,
        });
    } catch (err) {
        console.error("❌ getAllLocations error:", err);
        res.status(500).json({ message: "Failed to fetch locations" });
    }
};

// ====================================================
// 🌳 Get Hierarchical Tree
// ====================================================
exports.getLocationTree = async (req, res) => {
    try {
        const { search = "" } = req.query;
        const where = search
            ? {
                [Op.or]: [
                    { country: { [Op.like]: `%${search}%` } },
                    { state: { [Op.like]: `%${search}%` } },
                    { city: { [Op.like]: `%${search}%` } },
                ],
            }
            : {};
        applyMarketScope(where, req, {
            allowAdminOverride: true,
            allowExplicitOverride: true,
            allowAllForAdmin: true,
        });

        const all = await Location.findAll({
            where,
            order: [["name", "ASC"]],
        });


        const map = {};
        const roots = [];

        all.forEach((loc) => {
            const displayName = buildDisplayName(loc);
            map[loc.id] = { ...loc.dataValues, displayName, children: [] };
        });

        all.forEach((loc) => {
            if (loc.parentId && map[loc.parentId]) {
                map[loc.parentId].children.push(map[loc.id]);
            } else {
                roots.push(map[loc.id]);
            }
        });

        res.json(roots);
    } catch (err) {
        console.error("❌ getLocationTree error:", err);
        res.status(500).json({ message: "Failed to fetch locations tree" });
    }
};

// ====================================================
// 🔍 Get Single Location by ID
// ====================================================
exports.getLocationById = async (req, res) => {
    try {
        const location = await Location.findOne({
            where: applyMarketScope({ id: req.params.id }, req, {
                allowAdminOverride: true,
                allowExplicitOverride: true,
                allowAllForAdmin: true,
            }),
        });
        if (!location)
            return res.status(404).json({ message: "Location not found" });
        res.json(serializeLocation(location));
    } catch (err) {
        console.error("❌ getLocationById error:", err);
        res.status(500).json({ message: "Failed to fetch location" });
    }
};

// ====================================================
// 🛠️ Update Location
// ====================================================
exports.updateLocation = async (req, res) => {
    try {
        const location = await Location.findOne({
            where: applyMarketScope({ id: req.params.id }, req, {
                allowAdminOverride: true,
                allowAllForAdmin: true,
            }),
        });
        if (!location)
            return res.status(404).json({ message: "Location not found" });

        const data = {
            ...req.body,
            country: req.body.country?.trim() || null,
            countryCode: req.body.countryCode?.trim() || null,
            state: req.body.state?.trim() || null,
            city: req.body.city?.trim() || null,
            continent: req.body.continent?.trim() || null,
            timezone: req.body.timezone?.trim() || null,
            currency: req.body.currency?.trim() || "USD",
            slug: req.body.slug?.trim() || location.slug,
            affordabilityTier: req.body.affordabilityTier?.trim() || null,
        };
        assignMarketToPayload(data, req, { allowAdminOverride: true });

        data.latitude = toFloat(req.body.latitude);
        data.longitude = toFloat(req.body.longitude);
        data.rentMultiplier = toFloat(req.body.rentMultiplier);
        data.tags = normalizeJSON(req.body.tags);

        if (req.body.faqSchema) {
            try {
                data.faqSchema =
                    typeof req.body.faqSchema === "string"
                        ? JSON.parse(req.body.faqSchema)
                        : req.body.faqSchema;
            } catch {
                console.warn("⚠️ Invalid faqSchema JSON, skipping");
            }
        }

        if (req.body.parentId !== undefined) {
            data.parentId =
                req.body.parentId === "null" || req.body.parentId === ""
                    ? null
                    : parseInt(req.body.parentId, 10) || null;
        }

        if (req.files?.flag?.[0]) data.flag = moveFile(req.files.flag[0], "flags");
        if (req.files?.image?.[0]) data.image = moveFile(req.files.image[0], "locations");
        if (req.files?.metaImage?.[0]) data.metaImage = moveFile(req.files.metaImage[0], "locations");

        await location.update(data);
        res.json({ message: "✅ Location updated successfully", location: serializeLocation(location) });
    } catch (err) {
        console.error("❌ updateLocation error:", err);
        res.status(500).json({ message: "Failed to update location" });
    }
};

// ====================================================
// ❌ Delete Location
// ====================================================
exports.deleteLocation = async (req, res) => {
    try {
        const location = await Location.findOne({
            where: applyMarketScope({ id: req.params.id }, req, {
                allowAdminOverride: true,
                allowAllForAdmin: true,
            }),
        });
        if (!location)
            return res.status(404).json({ message: "Location not found" });

        await location.destroy();
        res.json({ message: "✅ Location deleted successfully" });
    } catch (err) {
        console.error("❌ deleteLocation error:", err);
        res.status(500).json({ message: "Failed to delete location" });
    }
};

// ====================================================
// 🇺🇳 Get Countries (for dropdowns)
// ====================================================
exports.getCountries = async (req, res) => {
    try {
        const countries = await Location.findAll({
            where: applyMarketScope({ type: "country" }, req, {
                allowAdminOverride: true,
                allowExplicitOverride: true,
                allowAllForAdmin: true,
            }),
            attributes: ["id", "name", "country", "flag", "slug"],
            order: [["country", "ASC"]],
        });
        res.json(countries);
    } catch (err) {
        console.error("❌ getCountries error:", err);
        res.status(500).json({ message: "Failed to fetch countries" });
    }
};

// ====================================================
// 🔍 Get Location by Slug
// ====================================================
exports.getLocationBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        let location = await Location.findOne({
            where: applyMarketScope({ slug }, req, {
                allowAdminOverride: true,
                allowExplicitOverride: true,
                allowAllForAdmin: true,
            }),
        });
        if (!location && isLocalDevHost(req)) {
            location = await Location.findOne({ where: { slug } });
        }
        if (!location) {
            return res.status(404).json({ message: "Location not found" });
        }

        const childrenLimit = Math.min(Math.max(parseInt(req.query.childrenLimit, 10) || 10, 1), 50);
        const childrenPage = Math.max(parseInt(req.query.childrenPage, 10) || 1, 1);
        const childrenOffset = (childrenPage - 1) * childrenLimit;
        const childSearch = req.query.childrenSearch?.trim() || "";
        console.log(
            `[getLocationBySlug] slug=${slug} childSearch="${childSearch}" page=${childrenPage} limit=${childrenLimit}`
        );
        const buildSearchClause = (term) => {
            if (!term) return null;
            return {
                [Op.or]: [
                    { name: { [Op.like]: `%${term}%` } },
                    { city: { [Op.like]: `%${term}%` } },
                    { state: { [Op.like]: `%${term}%` } },
                    { country: { [Op.like]: `%${term}%` } },
                    { slug: { [Op.like]: `%${term}%` } },
                ],
            };
        };
        const searchClause = buildSearchClause(childSearch);

        const runChildQuery = async (where) => {
            const finalWhere = { ...where };
            if (searchClause) {
                finalWhere[Op.and] = finalWhere[Op.and]
                    ? [...[].concat(finalWhere[Op.and]), searchClause]
                    : searchClause;
            }
            console.log("[getLocationBySlug] child query", finalWhere);
            return Location.findAndCountAll({
                where: applyMarketScope(finalWhere, req, {
                    allowAdminOverride: true,
                    allowExplicitOverride: true,
                    allowAllForAdmin: true,
                }),
                order: [["name", "ASC"]],
                limit: childrenLimit,
                offset: childrenOffset,
            });
        };

        const [jobCount, companyCount, recentJobs, locationCompanies] = await Promise.all([
            Job.count({ where: applyMarketScope({ locationId: location.id }, req, {
                allowAdminOverride: true,
                allowExplicitOverride: true,
                allowAllForAdmin: true,
            }) }),
            Company.count({ where: applyMarketScope({ locationId: location.id }, req, {
                allowAdminOverride: true,
                allowExplicitOverride: true,
                allowAllForAdmin: true,
            }) }),
            Job.findAll({
                where: applyMarketScope({ locationId: location.id }, req, {
                    allowAdminOverride: true,
                    allowExplicitOverride: true,
                    allowAllForAdmin: true,
                }),
                include: [
                    {
                        model: Company,
                        as: "company",
                        attributes: ["id", "name", "slug", "logoUrl", "industry", "size", "headquarters"],
                    },
                ],
                order: [["createdAt", "DESC"]],
                limit: 4,
            }),
            Company.findAll({
                where: applyMarketScope({ locationId: location.id }, req, {
                    allowAdminOverride: true,
                    allowExplicitOverride: true,
                    allowAllForAdmin: true,
                }),
                order: [["createdAt", "DESC"]],
                limit: 4,
            }),
        ]);

        let childResult = await runChildQuery({ parentId: location.id });
        if (!childResult) {
            childResult = { rows: [], count: 0 };
        }
        if (childResult.count === 0) {
            const slugPrefix = location.slug ? { slug: { [Op.like]: `${location.slug}--%` } } : null;
            if (slugPrefix) {
                console.log("[getLocationBySlug] fallback by slug prefix", slugPrefix);
                childResult = await runChildQuery(slugPrefix);
            }
        }
        if (!childResult) {
            childResult = { rows: [], count: 0 };
        }

        const parent = location.parentId
            ? await Location.findOne({
                  where: applyMarketScope({ id: location.parentId }, req, {
                      allowAdminOverride: true,
                      allowExplicitOverride: true,
                      allowAllForAdmin: true,
                  }),
              })
            : null;

        res.json({
            location: serializeLocation(location),
            stats: { jobCount, companyCount },
            parent: parent ? serializeLocation(parent) : null,
            children: childResult.rows.map(serializeLocation),
            childrenMeta: {
                total: childResult.count,
                page: childrenPage,
                totalPages: Math.max(Math.ceil(childResult.count / childrenLimit), 1),
                limit: childrenLimit,
                search: childSearch || "",
            },
            jobs: recentJobs.map((job) => job.toJSON()),
            companies: locationCompanies.map((company) => company.toJSON()),
        });
    } catch (err) {
        console.error("❌ getLocationBySlug error:", err);
        res.status(500).json({ message: "Failed to fetch location" });
    }
};

// ====================================================
// ⭐ Featured Locations (for homepage)
// ====================================================
exports.getFeaturedLocations = async (req, res) => {
    try {
        const { limit = 8 } = req.query;
        const featured = await Location.findAll({
            where: applyMarketScope({ isFeatured: true }, req, {
                allowAdminOverride: true,
                allowExplicitOverride: true,
                allowAllForAdmin: true,
            }),
            limit: parseInt(limit),
            order: [["name", "ASC"]],
        });

        const jobCounts = await Job.findAll({
            where: applyMarketScope({}, req, {
                allowAdminOverride: true,
                allowExplicitOverride: true,
                allowAllForAdmin: true,
            }),
            attributes: [
                "locationId",
                [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
            ],
            group: ["locationId"],
            raw: true,
        });

        const jobMap = Object.fromEntries(jobCounts.map((r) => [r.locationId, parseInt(r.count)]));

        const enriched = featured.map((loc) => ({
            ...serializeLocation(loc),
            jobCount: jobMap[loc.id] || 0,
        }));

        res.json(enriched);
    } catch (err) {
        console.error("❌ getFeaturedLocations error:", err);
        res.status(500).json({ message: "Failed to fetch featured locations" });
    }
};

// ====================================================
// 🔎 Search Locations by Name
// ====================================================
exports.searchLocations = async (req, res) => {
    try {
        const q = req.query.q?.trim() || "";
        const { type, limit = 20 } = req.query;
        const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

        const where = q
            ? {
                  [Op.or]: [
                      { name: { [Op.like]: `%${q}%` } },
                      { country: { [Op.like]: `%${q}%` } },
                      { state: { [Op.like]: `%${q}%` } },
                      { city: { [Op.like]: `%${q}%` } },
                      { slug: { [Op.like]: `%${q}%` } },
                  ],
              }
            : {};
        applyMarketScope(where, req, {
            allowAdminOverride: true,
            allowExplicitOverride: true,
            allowAllForAdmin: true,
        });
        if (type) where.type = type;

        const locations = await Location.findAll({
            where,
            limit: limitNum,
            order: [["name", "ASC"]],
        });
        const serialized = [];
        for (const location of locations) {
            const item = serializeLocation(location);
            const ancestors = await getAncestorTrail(location, req);
            serialized.push({
                ...item,
                ancestors,
                trailText: [...ancestors.map((ancestor) => ancestor.name), item.name]
                    .filter(Boolean)
                    .join(" > "),
            });
        }

        res.json({ locations: serialized });
    } catch (err) {
        console.error("❌ searchLocations error:", err);
        res.status(500).json({ error: "Failed to search locations" });
    }
};
