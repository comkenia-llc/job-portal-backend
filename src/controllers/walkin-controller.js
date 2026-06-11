const { Op, ValidationError } = require("sequelize");
const {
    WalkInInterview,
    WalkInInterviewRole,
    Job,
    Company,
    Location,
} = require("../models");

const slugifyValue = (value = "") =>
    value
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 90);

const toDateOrNull = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
};

const toBoolean = (value) =>
    value === true || value === "true" || value === "1" || value === 1;

const parseRoles = (roles) => {
    if (!roles) return [];
    if (Array.isArray(roles)) return roles;

    try {
        const parsed = JSON.parse(roles);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const generateUniqueSlug = async (title, excludeId = null) => {
    const base = slugifyValue(title) || `walk-in-${Date.now()}`;
    let slug = base;
    let counter = 1;

    while (
        await WalkInInterview.findOne({
            where: {
                slug,
                ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}),
            },
            attributes: ["id"],
        })
    ) {
        slug = `${base}-${counter++}`;
    }

    return slug;
};

const normalizeRolePayload = (role, walkInInterviewId) => ({
    walkInInterviewId,
    title: role.title?.trim(),
    salaryMin: role.salaryMin ? Number(role.salaryMin) : null,
    salaryMax: role.salaryMax ? Number(role.salaryMax) : null,
    currency: role.currency || "AED",
    experienceLevel: role.experienceLevel || null,
    description: role.description || null,
});

const includeDefault = [
    {
        model: Company,
        as: "company",
        attributes: ["id", "name", "slug", "logoUrl", "industry"],
        required: false,
    },
    {
        model: Location,
        as: "location",
        attributes: ["id", "name", "slug", "city", "state", "country"],
        required: false,
    },
    {
        model: WalkInInterviewRole,
        as: "roles",
        required: false,
    },
];

const buildLocationLabel = (location) =>
    location?.name ||
    [location?.city, location?.state, location?.country].filter(Boolean).join(", ") ||
    null;

const toPlain = (record) => (record?.toJSON ? record.toJSON() : record);

const normalizeWalkInJob = (jobRecord) => {
    const job = toPlain(jobRecord);
    const company = toPlain(job.company) || null;
    const locationSource = toPlain(job.jobLocation) || null;
    const location = locationSource
        ? {
              id: locationSource.id,
              name: locationSource.name,
              slug: locationSource.slug,
              city: locationSource.city,
              state: locationSource.state,
              country: locationSource.country,
          }
        : null;

    return {
        id: `job-${job.id}`,
        jobId: job.id,
        sourceType: "job",
        title: job.title,
        slug: job.slug,
        companyId: job.companyId,
        locationId: job.locationId,
        interviewStartDate: job.walkInInterviewDate,
        interviewEndDate: job.walkInInterviewEndDate,
        interviewTime: job.walkInInterviewTime,
        venueDetails: job.walkInInterviewLocation || buildLocationLabel(location) || null,
        mapUrl: job.walkInInterviewMapUrl,
        contactEmail: null,
        contactPhone: null,
        whatsapp: null,
        requirements: null,
        documentsRequired: null,
        instructions: job.walkInInterviewInstructions || null,
        status: job.status === "open" ? "open" : job.status,
        isFeatured: !!job.isFeatured,
        views: job.views || 0,
        seoTitle: job.seoTitle || null,
        seoDescription: job.seoDescription || null,
        seoKeywords: job.seoKeywords || null,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        company,
        location,
        roles: job.title
            ? [
                  {
                      id: `job-role-${job.id}`,
                      title: job.title,
                      description: null,
                  },
              ]
            : [],
    };
};

const matchesText = (value, query) =>
    String(value || "")
        .toLowerCase()
        .includes(String(query || "").toLowerCase());

const filterWalkInJobs = (items, req) => {
    const roleQuery = req.query.role?.trim().replace(/-/g, " ").toLowerCase();
    const keyword = req.query.keyword?.trim().toLowerCase();
    const companySlug = req.query.company?.trim().toLowerCase();
    const locationQuery = req.query.location?.trim().replace(/-/g, " ").toLowerCase();

    return items.filter((item) => {
        if (companySlug && item.company?.slug?.toLowerCase() !== companySlug) {
            return false;
        }

        if (locationQuery) {
            const locationMatched = [
                item.location?.slug,
                item.location?.name,
                item.location?.city,
                item.location?.state,
            ].some((value) => matchesText(value, locationQuery));

            if (!locationMatched) return false;
        }

        if (roleQuery) {
            const roleMatched = item.roles.some((role) => matchesText(role.title, roleQuery));
            if (!roleMatched) return false;
        }

        if (keyword) {
            const haystacks = [
                item.title,
                item.instructions,
                item.company?.name,
                item.company?.slug,
                item.location?.name,
                item.location?.slug,
                item.location?.city,
                item.location?.state,
                ...item.roles.map((role) => role.title),
            ];

            if (!haystacks.some((value) => matchesText(value, keyword))) {
                return false;
            }
        }

        return true;
    });
};

const sortWalkIns = (a, b) => {
    if (Boolean(b.isFeatured) !== Boolean(a.isFeatured)) {
        return Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured));
    }

    const aDate = a.interviewStartDate ? new Date(a.interviewStartDate).getTime() : Number.MAX_SAFE_INTEGER;
    const bDate = b.interviewStartDate ? new Date(b.interviewStartDate).getTime() : Number.MAX_SAFE_INTEGER;
    if (aDate !== bDate) return aDate - bDate;

    const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bCreated - aCreated;
};

exports.createWalkInInterview = async (req, res) => {
    try {
        const data = req.body || {};

        if (req.user.role !== "admin" && req.user.role !== "employer") {
            return res.status(403).json({
                error: "Only admins or employers can create walk-in interviews",
            });
        }

        if (!data.title || !data.companyId || !data.locationId || !data.interviewStartDate) {
            return res.status(400).json({
                error: "Missing required fields: title, companyId, locationId, interviewStartDate",
            });
        }

        const company = await Company.findByPk(data.companyId);
        if (!company) return res.status(400).json({ error: "Invalid company selected" });

        const location = await Location.findByPk(data.locationId);
        if (!location) return res.status(400).json({ error: "Invalid location selected" });

        const payload = {
            title: data.title.trim(),
            slug: await generateUniqueSlug(data.slug || data.title),
            companyId: Number(data.companyId),
            locationId: Number(data.locationId),

            interviewStartDate: toDateOrNull(data.interviewStartDate),
            interviewEndDate: toDateOrNull(data.interviewEndDate),
            interviewTime: data.interviewTime || null,

            venueDetails: data.venueDetails || null,
            mapUrl: data.mapUrl || null,

            contactEmail: data.contactEmail || null,
            contactPhone: data.contactPhone || null,
            whatsapp: data.whatsapp || null,

            requirements: data.requirements || null,
            documentsRequired: data.documentsRequired || null,
            instructions: data.instructions || null,

            status: data.status || "open",
            isFeatured: toBoolean(data.isFeatured),

            seoTitle: data.seoTitle || null,
            seoDescription: data.seoDescription || null,
            seoKeywords: data.seoKeywords || null,

            createdBy: req.user?.id || null,
        };

        const interview = await WalkInInterview.create(payload);

        const roles = parseRoles(data.roles);
        const cleanRoles = roles.filter((role) => role.title?.trim());

        if (cleanRoles.length) {
            await WalkInInterviewRole.bulkCreate(
                cleanRoles.map((role) => normalizeRolePayload(role, interview.id))
            );
        }

        const created = await WalkInInterview.findByPk(interview.id, {
            include: includeDefault,
        });

        return res.status(201).json(created);
    } catch (err) {
        console.error("❌ Create walk-in interview error:", err);

        if (err instanceof ValidationError) {
            return res.status(400).json({
                error: err.errors.map((e) => `${e.path}: ${e.message}`).join(", "),
            });
        }

        return res.status(500).json({
            error: "Failed to create walk-in interview",
            details: err.message,
        });
    }
};

exports.listWalkInInterviews = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page || "1", 10), 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit || "12", 10), 1), 100);
        const offset = (page - 1) * limit;
        const includeJobs = req.query.includeJobs === "true";

        const where = {
            status: req.query.status || "open",
        };

        if (req.query.companyId) {
            where.companyId = Number(req.query.companyId);
        }

        if (req.query.locationId) {
            where.locationId = Number(req.query.locationId);
        }

        if (req.query.isFeatured !== undefined) {
            where.isFeatured = req.query.isFeatured === "true";
        }

        if (req.query.today === "true") {
            const start = new Date();
            start.setHours(0, 0, 0, 0);

            const end = new Date();
            end.setHours(23, 59, 59, 999);

            where.interviewStartDate = { [Op.between]: [start, end] };
        }

        if (req.query.tomorrow === "true") {
            const start = new Date();
            start.setDate(start.getDate() + 1);
            start.setHours(0, 0, 0, 0);

            const end = new Date(start);
            end.setHours(23, 59, 59, 999);

            where.interviewStartDate = { [Op.between]: [start, end] };
        }

        if (req.query.thisWeek === "true") {
            const start = new Date();
            start.setHours(0, 0, 0, 0);

            const end = new Date();
            end.setDate(end.getDate() + 7);
            end.setHours(23, 59, 59, 999);

            where.interviewStartDate = { [Op.between]: [start, end] };
        }

        if (req.query.from || req.query.to) {
            where.interviewStartDate = where.interviewStartDate || {};

            if (req.query.from) {
                const fromDate = toDateOrNull(req.query.from);
                if (fromDate) where.interviewStartDate[Op.gte] = fromDate;
            }

            if (req.query.to) {
                const toDate = toDateOrNull(req.query.to);
                if (toDate) where.interviewStartDate[Op.lte] = toDate;
            }
        }

        const include = [
            {
                model: Company,
                as: "company",
                attributes: ["id", "name", "slug", "logoUrl", "industry"],
                required: false,
            },
            {
                model: Location,
                as: "location",
                attributes: ["id", "name", "slug", "city", "state", "country"],
                required: false,
            },
            {
                model: WalkInInterviewRole,
                as: "roles",
                required: false,
            },
        ];

        if (req.query.role) {
            include[2] = {
                model: WalkInInterviewRole,
                as: "roles",
                required: true,
                where: {
                    title: {
                        [Op.like]: `%${req.query.role.trim().replace(/-/g, " ")}%`,
                    },
                },
            };
        }

        if (req.query.location) {
            include[1] = {
                model: Location,
                as: "location",
                attributes: ["id", "name", "slug", "city", "state", "country"],
                required: true,
                where: {
                    [Op.or]: [
                        { slug: req.query.location },
                        { name: { [Op.like]: `%${req.query.location.replace(/-/g, " ")}%` } },
                        { city: { [Op.like]: `%${req.query.location.replace(/-/g, " ")}%` } },
                        { state: { [Op.like]: `%${req.query.location.replace(/-/g, " ")}%` } },
                    ],
                },
            };
        }

        if (req.query.company) {
            include[0] = {
                model: Company,
                as: "company",
                attributes: ["id", "name", "slug", "logoUrl", "industry"],
                required: true,
                where: {
                    slug: req.query.company,
                },
            };
        }

        if (req.query.keyword) {
            const keyword = req.query.keyword.trim();

            where[Op.and] = where[Op.and] || [];
            where[Op.and].push({
                [Op.or]: [
                    { title: { [Op.like]: `%${keyword}%` } },
                    { requirements: { [Op.like]: `%${keyword}%` } },
                    { documentsRequired: { [Op.like]: `%${keyword}%` } },
                    { instructions: { [Op.like]: `%${keyword}%` } },
                    { "$roles.title$": { [Op.like]: `%${keyword}%` } },
                    { "$company.name$": { [Op.like]: `%${keyword}%` } },
                    { "$company.slug$": { [Op.like]: `%${keyword}%` } },
                    { "$location.name$": { [Op.like]: `%${keyword}%` } },
                    { "$location.slug$": { [Op.like]: `%${keyword}%` } },
                    { "$location.city$": { [Op.like]: `%${keyword}%` } },
                    { "$location.state$": { [Op.like]: `%${keyword}%` } },
                ],
            });
        }

        const interviews = await WalkInInterview.findAll({
            where,
            include,
            distinct: true,
            subQuery: false,
            order: [
                ["isFeatured", "DESC"],
                ["interviewStartDate", "ASC"],
                ["createdAt", "DESC"],
            ],
        });

        let combined = interviews.map((item) => item.toJSON());

        if (includeJobs) {
            const jobWhere = {
                isWalkInInterview: true,
            };

            if (req.query.status) {
                jobWhere.status = req.query.status;
            } else {
                jobWhere.status = "open";
            }

            if (req.query.companyId) {
                jobWhere.companyId = Number(req.query.companyId);
            }

            if (req.query.locationId) {
                jobWhere.locationId = Number(req.query.locationId);
            }

            if (req.query.isFeatured !== undefined) {
                jobWhere.isFeatured = req.query.isFeatured === "true";
            }

            if (where.interviewStartDate?.[Op.between]) {
                jobWhere.walkInInterviewDate = {
                    [Op.between]: where.interviewStartDate[Op.between],
                };
            } else if (where.interviewStartDate) {
                jobWhere.walkInInterviewDate = {};
                if (where.interviewStartDate[Op.gte]) {
                    jobWhere.walkInInterviewDate[Op.gte] = where.interviewStartDate[Op.gte];
                }
                if (where.interviewStartDate[Op.lte]) {
                    jobWhere.walkInInterviewDate[Op.lte] = where.interviewStartDate[Op.lte];
                }
            }

            const walkInJobs = await Job.findAll({
                where: jobWhere,
                include: [
                    {
                        model: Company,
                        as: "company",
                        attributes: ["id", "name", "slug", "logoUrl", "industry"],
                        required: false,
                    },
                    {
                        model: Location,
                        as: "jobLocation",
                        attributes: ["id", "name", "slug", "city", "state", "country"],
                        required: false,
                    },
                ],
                order: [
                    ["isFeatured", "DESC"],
                    ["walkInInterviewDate", "ASC"],
                    ["createdAt", "DESC"],
                ],
            });

            const normalizedJobs = filterWalkInJobs(
                walkInJobs.map(normalizeWalkInJob),
                req
            );

            combined = combined.concat(normalizedJobs);
        }

        combined.sort(sortWalkIns);
        const paginated = combined.slice(offset, offset + limit);

        return res.json({
            total: combined.length,
            page,
            limit,
            totalPages: Math.ceil(combined.length / limit),
            interviews: paginated,
        });
    } catch (err) {
        console.error("❌ List walk-in interviews error:", err);
        return res.status(500).json({
            error: "Failed to fetch walk-in interviews",
            details: err.message,
        });
    }
};

exports.getWalkInInterview = async (req, res) => {
    try {
        const identifier = req.params.identifier;
        const includeJobs = req.query.includeJobs === "true";

        const where = /^\d+$/.test(String(identifier))
            ? { id: Number(identifier) }
            : { slug: identifier };

        const interview = await WalkInInterview.findOne({
            where,
            include: includeDefault,
        });

        if (interview) {
            interview.views += 1;
            await interview.save();

            return res.json(interview);
        }

        if (includeJobs) {
            const job = await Job.findOne({
                where: {
                    ...where,
                    isWalkInInterview: true,
                },
                include: [
                    {
                        model: Company,
                        as: "company",
                        attributes: ["id", "name", "slug", "logoUrl", "industry"],
                        required: false,
                    },
                    {
                        model: Location,
                        as: "jobLocation",
                        attributes: ["id", "name", "slug", "city", "state", "country"],
                        required: false,
                    },
                ],
            });

            if (job) {
                return res.json(normalizeWalkInJob(job));
            }
        }

        return res.status(404).json({ error: "Walk-in interview not found" });
    } catch (err) {
        console.error("❌ Get walk-in interview error:", err);
        return res.status(500).json({
            error: "Failed to fetch walk-in interview",
            details: err.message,
        });
    }
};

exports.updateWalkInInterview = async (req, res) => {
    try {
        const interview = await WalkInInterview.findByPk(req.params.id);

        if (!interview) {
            return res.status(404).json({ error: "Walk-in interview not found" });
        }

        const data = req.body || {};

        if (data.companyId) {
            const company = await Company.findByPk(data.companyId);
            if (!company) return res.status(400).json({ error: "Invalid company selected" });
        }

        if (data.locationId) {
            const location = await Location.findByPk(data.locationId);
            if (!location) return res.status(400).json({ error: "Invalid location selected" });
        }

        const payload = {
            title: data.title?.trim() || interview.title,
            companyId: data.companyId ? Number(data.companyId) : interview.companyId,
            locationId: data.locationId ? Number(data.locationId) : interview.locationId,

            interviewStartDate: toDateOrNull(data.interviewStartDate) || interview.interviewStartDate,
            interviewEndDate: toDateOrNull(data.interviewEndDate),
            interviewTime: data.interviewTime || null,

            venueDetails: data.venueDetails || null,
            mapUrl: data.mapUrl || null,

            contactEmail: data.contactEmail || null,
            contactPhone: data.contactPhone || null,
            whatsapp: data.whatsapp || null,

            requirements: data.requirements || null,
            documentsRequired: data.documentsRequired || null,
            instructions: data.instructions || null,

            status: data.status || interview.status,
            isFeatured: toBoolean(data.isFeatured),

            seoTitle: data.seoTitle || null,
            seoDescription: data.seoDescription || null,
            seoKeywords: data.seoKeywords || null,
        };

        if (data.slug || data.title) {
            payload.slug = await generateUniqueSlug(data.slug || data.title, interview.id);
        }

        await interview.update(payload);

        if (data.roles !== undefined) {
            const roles = parseRoles(data.roles);
            const cleanRoles = roles.filter((role) => role.title?.trim());

            await WalkInInterviewRole.destroy({
                where: { walkInInterviewId: interview.id },
            });

            if (cleanRoles.length) {
                await WalkInInterviewRole.bulkCreate(
                    cleanRoles.map((role) => normalizeRolePayload(role, interview.id))
                );
            }
        }

        const updated = await WalkInInterview.findByPk(interview.id, {
            include: includeDefault,
        });

        return res.json(updated);
    } catch (err) {
        console.error("❌ Update walk-in interview error:", err);
        return res.status(500).json({
            error: "Failed to update walk-in interview",
            details: err.message,
        });
    }
};

exports.deleteWalkInInterview = async (req, res) => {
    try {
        const interview = await WalkInInterview.findByPk(req.params.id);

        if (!interview) {
            return res.status(404).json({ error: "Walk-in interview not found" });
        }

        await interview.destroy();

        return res.json({ message: "Walk-in interview deleted successfully" });
    } catch (err) {
        console.error("❌ Delete walk-in interview error:", err);
        return res.status(500).json({
            error: "Failed to delete walk-in interview",
            details: err.message,
        });
    }
};
