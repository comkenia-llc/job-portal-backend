const { Op, Sequelize, ValidationError } = require("sequelize");
const {
    Job,
    Company,
    User,
    Location,
    Skill,
    JobFunction,
    JobCategory,
    JobIndustry
} = require("../models");
const {
    getEmployerPlanFeatures,
    parseFeatureNumber,
    isFeatureEnabled,
} = require("../utils/planFeatures");
const { applyMarketScope, assignMarketToPayload } = require("../utils/market");
const { assertEmployerMarketAccess } = require("../utils/marketAccess");
const {
    buildCompanyProfileStrength,
    PROFILE_COMPLETION_THRESHOLD,
} = require("../utils/companyProfileStrength");
const {
    sendTemplateMail,
    getSiteUrl,
    getEmployerDashboardUrl,
    getEmployerApplicantsUrl,
    getPostJobUrl,
    getAdminNotificationEmail,
} = require("../services/mailTemplateService");

const clean = (val) => (typeof val === "string" ? val.trim().slice(0, 500) : val || null);
const JOB_TITLE_MIN_LENGTH = 8;
const JOB_TITLE_MAX_LENGTH = 80;
const JOB_DESCRIPTION_MIN_LENGTH = 150;
const JOB_DESCRIPTION_MAX_LENGTH = 8000;
const JOB_REQUIRED_FIELDS = [
    "title",
    "description",
    "companyId",
    "locationId",
    "type",
    "salaryMin",
    "salaryMax",
    "currency",
    "deadline",
];

const stripHtml = (value = "") =>
    value
        .toString()
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const validateJobCopy = (title, description) => {
    const normalizedTitle = typeof title === "string" ? title.trim() : "";
    const normalizedDescription = stripHtml(description);

    if (normalizedTitle.length < JOB_TITLE_MIN_LENGTH || normalizedTitle.length > JOB_TITLE_MAX_LENGTH) {
        return `Job title should be between ${JOB_TITLE_MIN_LENGTH} and ${JOB_TITLE_MAX_LENGTH} characters.`;
    }

    if (
        normalizedDescription.length < JOB_DESCRIPTION_MIN_LENGTH ||
        normalizedDescription.length > JOB_DESCRIPTION_MAX_LENGTH
    ) {
        return `Job description should be between ${JOB_DESCRIPTION_MIN_LENGTH} and ${JOB_DESCRIPTION_MAX_LENGTH} characters.`;
    }

    return "";
};

const validateSalaryRange = (salaryMin, salaryMax) => {
    if (salaryMin === null || salaryMin === undefined || salaryMax === null || salaryMax === undefined) {
        return "Add both minimum and maximum salary.";
    }

    if (!Number.isFinite(salaryMin) || !Number.isFinite(salaryMax)) {
        return "Salary range is invalid.";
    }

    if (salaryMin < 0 || salaryMax < 0) {
        return "Salary cannot be negative.";
    }

    if (salaryMax < salaryMin) {
        return "Maximum salary must be greater than or equal to minimum salary.";
    }

    return "";
};

const formatSalaryText = (job) => {
    if (!job?.salaryMin && !job?.salaryMax) return "";
    const currency = job.currency || "AED";
    if (job.salaryMin && job.salaryMax) {
        return `${currency} ${job.salaryMin} - ${job.salaryMax}`;
    }
    return `${currency} ${job.salaryMin || job.salaryMax}`;
};

// Create a new job
const parseJSON = (value, fallback = null) => {
    if (!value) return fallback;
    try {
        return typeof value === "string" ? JSON.parse(value) : value;
    } catch {
        return fallback;
    }
};

const slugifyValue = (value) =>
    (value || "")
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 90);

const isNumericIdentifier = (value) => /^\d+$/.test(String(value ?? "").trim());

const buildIdentifierWhere = (identifier) =>
    isNumericIdentifier(identifier)
        ? { id: Number(identifier) }
        : { slug: identifier };

const findJobByIdentifier = (identifier, include = [], extraWhere = {}) => {
    if (!identifier) return null;
    return Job.findOne({
        where: { ...buildIdentifierWhere(identifier), ...extraWhere },
        include,
    });
};

const generateUniqueSlug = async (rawValue, excludeId = null, market = null) => {
    const base = slugifyValue(rawValue) || `job-${Date.now()}`;
    let slug = base;
    let counter = 1;

    while (
        await Job.findOne({
            where: {
                slug,
                ...(excludeId
                    ? {
                        id: {
                            [Op.ne]: excludeId,
                        },
                    }
                    : {}),
                ...(market ? { market } : {}),
            },
            attributes: ["id"],
        })
    ) {
        slug = `${base}-${counter++}`;
    }

    return slug;
};

const buildSlugSeed = ({ title, companyName, location }) =>
    [title, companyName, location].filter(Boolean).join(" ");

const toNumber = (value) => {
    if (value === undefined || value === null || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const toBoolean = (value) => {
    if (value === true || value === "true" || value === "1" || value === 1) return true;
    if (value === false || value === "false" || value === "0" || value === 0) return false;
    return false;
};

const toDateOrNull = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
};

const normalizeWalkInFields = (data) => {
    data.isWalkInInterview = toBoolean(data.isWalkInInterview);

    data.walkInInterviewDate = toDateOrNull(data.walkInInterviewDate);
    data.walkInInterviewEndDate = toDateOrNull(data.walkInInterviewEndDate);

    data.walkInInterviewTime = clean(data.walkInInterviewTime);
    data.walkInInterviewMapUrl = clean(data.walkInInterviewMapUrl);
    data.walkInInterviewInstructions =
        typeof data.walkInInterviewInstructions === "string"
            ? data.walkInInterviewInstructions.trim()
            : data.walkInInterviewInstructions || null;

    if (!data.isWalkInInterview) {
        data.walkInInterviewDate = null;
        data.walkInInterviewEndDate = null;
        data.walkInInterviewTime = null;
        data.walkInInterviewMapUrl = null;
        data.walkInInterviewInstructions = null;
    }

    return data;
};

const normalizeIds = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) return parsed.filter(Boolean);
        } catch {
            return value
                .split(",")
                .map((v) => v.trim())
                .filter(Boolean);
        }
    }
    return [];
};

const isLocalDevHost = (req) => {
    const host = String(req.get("host") || req.headers.host || "").toLowerCase();
    return (
        host.includes("localhost") ||
        host.includes("127.0.0.1") ||
        host.includes("0.0.0.0")
    );
};

const resolveJobStatus = (value, fallback = "open") => {
    const normalized = String(value || fallback).trim().toLowerCase();
    return ["open", "closed", "draft"].includes(normalized) ? normalized : fallback;
};

// ✅ Create Job
exports.createJob = async (req, res) => {
    try {
        if (req.user.role !== "admin" && req.user.role !== "employer") {
            return res.status(403).json({ error: "Only employers or admins can create jobs" });
        }
        if (req.user.role === "employer") {
            const access = await assertEmployerMarketAccess(req);
            if (!access.ok) {
                return res.status(access.status).json({ error: access.error });
            }
        }

        const data = req.body || {};
        console.log("🟢 [CREATE JOB] Raw body:", data);
        assignMarketToPayload(data, req, { allowAdminOverride: true });

        // Convert empty strings → null
        Object.keys(data).forEach((k) => {
            if (data[k] === "") data[k] = null;
        });

        if (data.jobIndustryId) {
            const jobIndustry = await JobIndustry.findByPk(data.jobIndustryId);

            if (!jobIndustry) {
                return res.status(400).json({ error: "Invalid job industry selected" });
            }

            if (jobIndustry.market && jobIndustry.market !== data.market) {
                return res.status(400).json({
                    error: "Selected industry belongs to a different market",
                });
            }

            data.industry = jobIndustry.name;
            data.jobIndustryId = Number(data.jobIndustryId);
        }

        // Validate required fields
        if (!data.title || !data.description || !data.companyId) {
            return res.status(400).json({
                error: "Missing required fields: title, description, or company",
            });
        }
        if (!data.deadline) {
            return res.status(400).json({ error: "Application deadline is required" });
        }

        // Validate company
        const company = await Company.findByPk(data.companyId);
        if (!company) return res.status(400).json({ error: "Invalid company selected" });
        if (company.market && company.market !== data.market) {
            return res.status(400).json({ error: "Selected company belongs to a different market" });
        }

        const companyProfileStrength = buildCompanyProfileStrength(company.toJSON());
        if (req.user.role === "employer" && companyProfileStrength.score < PROFILE_COMPLETION_THRESHOLD) {
            return res.status(403).json({
                error: `Complete your company profile to at least ${PROFILE_COMPLETION_THRESHOLD}% before posting jobs.`,
                profileStrength: companyProfileStrength,
            });
        }

        data.locationId = data.locationId || company.locationId;
        if (!data.locationId) {
            return res.status(400).json({
                error: "Add a primary company location before posting a job.",
            });
        }

        // Validate location
        const location = await Location.findByPk(data.locationId);
        if (!location) return res.status(400).json({ error: "Invalid location selected" });
        if (location.market && location.market !== data.market) {
            return res.status(400).json({ error: "Selected location belongs to a different market" });
        }
        const deadline = toDateOrNull(data.deadline);
        if (!deadline) {
            return res.status(400).json({ error: "Application deadline is required" });
        }

        // Ensure employer owns the company
        if (req.user.role === "employer" && company.createdBy !== req.user.id) {
            return res.status(403).json({ error: "You can only post jobs for your own company" });
        }

        // Optional job category
        if (data.jobCategoryId) {
            const jobCategory = await JobCategory.findByPk(data.jobCategoryId);
            if (!jobCategory) {
                return res.status(400).json({ error: "Invalid job category selected" });
            }
        }
        if (data.jobSubCategoryId) {
            const jobSubCategory = await JobCategory.findByPk(data.jobSubCategoryId);
            if (!jobSubCategory) {
                return res.status(400).json({ error: "Invalid job subcategory selected" });
            }
        }

        // Handle file uploads
        if (req.files?.metaImage) {
            data.metaImage = `/uploads/jobs/meta/${req.files.metaImage[0].filename}`;
        }

        // Parse JSON fields
        data.tags = parseJSON(data.tags, []);
        data.faqSchema = parseJSON(data.faqSchema, null);

        data.salaryMin = data.salaryMin ? parseFloat(data.salaryMin) : null;
        data.salaryMax = data.salaryMax ? parseFloat(data.salaryMax) : null;

        const missingJobFields = JOB_REQUIRED_FIELDS.filter((field) => {
            if (field === "locationId") return !data.locationId;
            if (field === "salaryMin") return data.salaryMin === null;
            if (field === "salaryMax") return data.salaryMax === null;
            return !data[field];
        });
        if (missingJobFields.length) {
            return res.status(400).json({
                error: `Complete the required job details before posting: ${missingJobFields.join(", ")}`,
            });
        }

        // Clean strings
        data.title = clean(data.title);
        data.description = data.description?.trim() || "";
        const copyValidationError = validateJobCopy(data.title, data.description);
        if (copyValidationError) {
            return res.status(400).json({ error: copyValidationError });
        }
        data.type = clean(data.type);
        const fallbackLocationLabel =
            location.name ||
            [location.city, location.state, location.country].filter(Boolean).join(", ") ||
            location.slug ||
            `Location ${location.id}`;
        data.location = fallbackLocationLabel;
        data.currency = clean(data.currency);
        data.industry = clean(data.industry);
        data.skills = clean(data.skills);
        data.experienceLevel = clean(data.experienceLevel);
        data.educationLevel = clean(data.educationLevel);
        data.applicationUrl = clean(data.applicationUrl);
        data.deadline = deadline;
        data.schemaType = data.schemaType || "JobPosting";
        data.status = resolveJobStatus(data.status, "open");
        if (data.jobCategoryId) data.jobCategoryId = Number(data.jobCategoryId);
        if (data.jobSubCategoryId) data.jobSubCategoryId = Number(data.jobSubCategoryId);

        const salaryValidationError = validateSalaryRange(data.salaryMin, data.salaryMax);
        if (salaryValidationError) {
            return res.status(400).json({ error: salaryValidationError });
        }

        // Numeric values
        data.remote = !!data.remote;
        data.postedBy = req.user.id;
        const slugSeed = data.slug || buildSlugSeed({
            title: data.title,
            companyName: company.name,
            location: location.name,
        });
        data.slug = await generateUniqueSlug(slugSeed, null, data.market);

        const skillIds = normalizeIds(req.body.skillIds || req.body.skill_entities || req.body.skillEntities);
        const functionIds = normalizeIds(req.body.functionIds || req.body.functions || req.body.functionEntities);

        // 🔒 Employer plan enforcement (admins bypass)
        if (req.user?.role === "employer") {
            const companyId = req.user.companyId || data.companyId;
            const features = await getEmployerPlanFeatures(companyId);
            if (!features) {
                return res.status(402).json({ error: "No active plan found for this employer." });
            }
            const targetStatus = resolveJobStatus(data.status, "open");
            const isPublishingLiveJob = targetStatus === "open";

            if (isPublishingLiveJob && !isFeatureEnabled(features.can_post_jobs)) {
                return res.status(403).json({ error: "Your plan does not allow posting jobs." });
            }
            const maxJobs = parseFeatureNumber(features.max_jobs, null);
            if (isPublishingLiveJob && Number.isFinite(maxJobs)) {
                const activeJobs = await Job.count({ where: { companyId, status: "open" } });
                if (activeJobs >= maxJobs) {
                    return res.status(403).json({ error: "Job posting limit reached for your plan." });
                }
            }

            const wantsFeatured = data.isFeatured === true || data.isFeatured === "true";
            if (isPublishingLiveJob && wantsFeatured) {
                if (!isFeatureEnabled(features.can_feature_jobs)) {
                    return res.status(403).json({ error: "Your plan does not allow featured jobs." });
                }
                const featuredLimit = parseFeatureNumber(features.featured_jobs_limit, 0);
                if (featuredLimit > 0) {
                    const featuredCount = await Job.count({ where: { companyId, isFeatured: true, status: "open" } });
                    if (featuredCount >= featuredLimit) {
                        return res.status(403).json({ error: "Featured job limit reached for your plan." });
                    }
                }
            }
        }

        // ✅ Create job
        normalizeWalkInFields(data);
        const job = await Job.create(data);
        console.log("✅ [CREATE JOB] Saved successfully:", job.id);

        if (skillIds.length && job.setSkillEntities) {
            await job.setSkillEntities(skillIds);
        }

        if (functionIds.length && job.setFunctions) {
            await job.setFunctions(functionIds);
        }

        if (req.user.role === "employer") {
            const employerName =
                `${req.user.firstName || ""} ${req.user.lastName || ""}`.trim() ||
                req.user.username ||
                req.user.email ||
                "there";
            const employerEmail = req.user.email || "";
            const siteUrl = getSiteUrl();
            const jobUrl = job.slug ? `${siteUrl}/jobs/${job.slug}` : `${siteUrl}/jobs`;

            if (employerEmail) {
                sendTemplateMail({
                    template: "jobSubmitted",
                    to: employerEmail,
                    data: {
                        employerName,
                        companyName: company.name || "",
                        jobTitle: job.title,
                        location: job.location || "",
                        jobType: job.type || "",
                        salaryText: formatSalaryText(job),
                        submittedAt: job.createdAt || new Date(),
                        dashboardJobUrl: getEmployerDashboardUrl(),
                        editJobUrl: getEmployerDashboardUrl(),
                        postAnotherJobUrl: getPostJobUrl(),
                    },
                }).catch((mailErr) =>
                    console.warn("⚠️ [MAILER] Job submitted email failed:", mailErr.message)
                );
            }

            sendTemplateMail({
                template: "adminNewJob",
                to: getAdminNotificationEmail(),
                data: {
                    jobTitle: job.title,
                    jobSlug: job.slug,
                    jobType: job.type || "",
                    jobStatus: job.status || "open",
                    companyName: company.name || "",
                    employerName,
                    employerEmail,
                    location: job.location || "",
                    industry: job.industry || "",
                    salaryMin: job.salaryMin || "",
                    salaryMax: job.salaryMax || "",
                    currency: job.currency || "AED",
                    experienceLevel: job.experienceLevel || "",
                    educationLevel: job.educationLevel || "",
                    deadline: job.deadline || "",
                    submittedAt: job.createdAt || new Date(),
                    reviewUrl: `${siteUrl}/admin/jobs`,
                    jobPreviewUrl: jobUrl,
                    adminDashboardUrl: `${siteUrl}/admin`,
                },
            }).catch((mailErr) =>
                console.warn("⚠️ [MAILER] Admin new job email failed:", mailErr.message)
            );
        }

        res.status(201).json(job);
    } catch (err) {
        console.error("❌ Create job error:", err);

        if (err instanceof ValidationError) {
            const messages = err.errors.map((e) => `${e.path}: ${e.message}`);
            return res.status(400).json({ error: messages.join(", ") });
        }

        if (err.parent?.sqlMessage?.includes("Data truncated")) {
            return res.status(400).json({
                error: "Invalid data type or too long value. Please check your inputs.",
                details: err.parent.sqlMessage,
            });
        }

        res.status(500).json({ error: "Failed to create job", details: err.message });
    }
};

// Get all jobs (with pagination + filters)
exports.listJobs = async (req, res) => {
    try {
        const page = parseInt(req.query.page || "1", 10);
        const limit = Math.min(Math.max(parseInt(req.query.limit || "10", 10), 1), 50);
        const offset = (page - 1) * limit;

        // ✅ Start with an empty where object
        const where = applyMarketScope({}, req, {
            allowAdminOverride: true,
            allowAllForAdmin: true,
        });

        // ✅ Keyword search: match title, description, skills, etc.
        if (req.query.keyword) {
            const keyword = req.query.keyword.trim();
            where[Op.or] = [
                { title: { [Op.like]: `%${keyword}%` } },
                { description: { [Op.like]: `%${keyword}%` } },
                { skills: { [Op.like]: `%${keyword}%` } },
                { industry: { [Op.like]: `%${keyword}%` } },
            ];
        }

        // ✅ Location filter (only match existing `location` column)
        if (req.query.location) {
            const loc = req.query.location.trim();
            where.location = { [Op.like]: `%${loc}%` };
        }

        // ✅ Optional filters
        if (req.query.type) where.type = req.query.type;
        if (req.query.status) where.status = req.query.status;

        if (req.query.isWalkInInterview !== undefined) {
            where.isWalkInInterview = req.query.isWalkInInterview === "true";
        }

        if (req.query.walkInInterviewEmirate) {
            where.walkInInterviewEmirate = {
                [Op.like]: `%${req.query.walkInInterviewEmirate.trim()}%`,
            };
        }

        if (req.query.walkInFrom || req.query.walkInTo) {
            where.walkInInterviewDate = where.walkInInterviewDate || {};

            if (req.query.walkInFrom) {
                const fromDate = new Date(req.query.walkInFrom);
                if (!isNaN(fromDate)) where.walkInInterviewDate[Op.gte] = fromDate;
            }

            if (req.query.walkInTo) {
                const toDate = new Date(req.query.walkInTo);
                if (!isNaN(toDate)) where.walkInInterviewDate[Op.lte] = toDate;
            }
        }

        if (req.query.experienceLevel) where.experienceLevel = req.query.experienceLevel;
        if (req.query.educationLevel) where.educationLevel = req.query.educationLevel;

        // Industry filter with slug fallback (case-insensitive)
        

        if (req.query.remote) where.remote = req.query.remote === "true";
        const minSalary = toNumber(req.query.minSalary || req.query.salaryMin);
        const maxSalary = toNumber(req.query.maxSalary || req.query.salaryMax);
        if (minSalary !== null || maxSalary !== null) {
            where.salaryMin = where.salaryMin || {};
            where.salaryMax = where.salaryMax || {};
            if (minSalary !== null) where.salaryMin[Op.gte] = minSalary;
            if (maxSalary !== null) where.salaryMax[Op.lte] = maxSalary;
        }
        if (req.query.deadlineBefore) {
            const dt = new Date(req.query.deadlineBefore);
            if (!isNaN(dt)) {
                where.deadline = where.deadline || {};
                where.deadline[Op.lte] = dt;
            }
        }
        if (req.query.deadlineAfter) {
            const dt = new Date(req.query.deadlineAfter);
            if (!isNaN(dt)) {
                where.deadline = where.deadline || {};
                where.deadline[Op.gte] = dt;
            }
        }

        const include = [
            {
                model: Company,
                as: "company",
                attributes: ["id", "name", "slug", "logoUrl", "industry"],
            },
            {
                model: JobCategory,
                as: "jobCategory",
                attributes: ["id", "name", "slug"],
            },
            {
                model: JobCategory,
                as: "jobSubCategory",
                attributes: ["id", "name", "slug"],
            },
            {
                model: User,
                as: "poster",
                attributes: ["id", "username", "email"],
            },
            {
                model: JobIndustry,
                as: "jobIndustry",
                attributes: ["id", "name", "slug"],
            },
        ];

        const industryFilter = req.query.industryId || req.query.industrySlug || req.query.industry;

        if (industryFilter) {
            if (req.query.industryId || /^\d+$/.test(String(industryFilter))) {
                where.jobIndustryId = Number(industryFilter);
            } else {
                const industrySlug = String(industryFilter).trim().toLowerCase();

                const jobIndustryInclude = include.find((item) => item.as === "jobIndustry");

                if (jobIndustryInclude) {
                    jobIndustryInclude.where = { slug: industrySlug };
                    jobIndustryInclude.required = true;
                }
            }
        }
        // Taxonomy filters
        const skillFilter = req.query.skillId || req.query.skillSlug;
        const functionFilter = req.query.functionId || req.query.functionSlug;
        const categoryFilter = req.query.jobCategoryId || req.query.jobCategorySlug;
        const subCategoryFilter = req.query.jobSubCategoryId || req.query.jobSubCategorySlug;
        const includeTaxonomies = req.query.includeTaxonomy === "true";

        if (includeTaxonomies) {
            include.push(
                {
                    model: Skill,
                    as: "skillEntities",
                    attributes: ["id", "name", "slug", "category", "isFeatured"],
                    through: { attributes: [] },
                },
                {
                    model: JobFunction,
                    as: "functions",
                    attributes: ["id", "name", "slug", "parentId", "isFeatured"],
                    through: { attributes: [] },
                }
            );
        }

        if (req.query.isFeatured !== undefined) {
            where.isFeatured = req.query.isFeatured === "true";
        }

        if (categoryFilter) {
            const catWhere = {};
            if (req.query.jobCategoryId) catWhere.id = req.query.jobCategoryId;
            if (req.query.jobCategorySlug) catWhere.slug = req.query.jobCategorySlug;
            include.push({
                model: JobCategory,
                as: "jobCategory",
                attributes: ["id", "name", "slug"],
                where: catWhere,
                required: true,
            });
        }

        if (subCategoryFilter) {
            const catWhere = {};
            if (req.query.jobSubCategoryId) catWhere.id = req.query.jobSubCategoryId;
            if (req.query.jobSubCategorySlug) catWhere.slug = req.query.jobSubCategorySlug;
            include.push({
                model: JobCategory,
                as: "jobSubCategory",
                attributes: ["id", "name", "slug"],
                where: catWhere,
                required: true,
            });
        }

        let skillRecord = null;
        if (req.query.skillSlug) {
            skillRecord = await Skill.findOne({
                where: { slug: req.query.skillSlug },
                attributes: ["id", "slug"],
            });
        }

        if (skillFilter) {
            const skillWhere = {};
            if (req.query.skillId) skillWhere.id = req.query.skillId;
            if (req.query.skillSlug && skillRecord) skillWhere.slug = req.query.skillSlug;

            if (skillRecord || req.query.skillId) {
                include.push({
                    model: Skill,
                    as: "skillEntities",
                    attributes: ["id", "name", "slug"],
                    through: { attributes: [] },
                    where: skillWhere,
                    required: true,
                });
            } else if (req.query.skillSlug) {
                // fallback to text search in legacy skills column
                where.skills = { [Op.like]: `%${req.query.skillSlug.replace(/-/g, " ")}%` };
            }
        } else if (includeTaxonomies) {
            include.push({
                model: Skill,
                as: "skillEntities",
                attributes: ["id", "name", "slug", "category", "isFeatured"],
                through: { attributes: [] },
            });
        }

        if (functionFilter) {
            const fnWhere = {};
            if (req.query.functionId) fnWhere.id = req.query.functionId;
            if (req.query.functionSlug) fnWhere.slug = req.query.functionSlug;

            include.push({
                model: JobFunction,
                as: "functions",
                attributes: ["id", "name", "slug", "parentId", "isFeatured"],
                through: { attributes: [] },
                where: fnWhere,
            });
        } else if (includeTaxonomies) {
            include.push({
                model: JobFunction,
                as: "functions",
                attributes: ["id", "name", "slug", "parentId", "isFeatured"],
                through: { attributes: [] },
            });
        }

        const sort = req.query.sort;
        const usesTaxonomyFilter = Boolean(skillFilter || functionFilter);
        console.log("[listJobs] filters", {
            skillFilter,
            skillRecordFound: !!skillRecord,
            functionFilter,
            includeTaxonomies,
            hasLegacySkillWhere: !!where.skills,
        });

        if (sort === "views" || req.query.isFeatured !== undefined || usesTaxonomyFilter) {
            const order =
                sort === "views"
                    ? [
                          ["views", "DESC"],
                          ["createdAt", "DESC"],
                      ]
                    : [["updatedAt", "DESC"]];

            const { rows, count } = await Job.findAndCountAll({
                where,
                include,
                distinct: true,
                order,
                limit,
                offset,
            });

            return res.json({
                total: count,
                page,
                limit,
                jobs: rows,
            });
        }

        const total = await Job.count({
            where,
            include,
            distinct: true,
        });
        const FEATURED_CAP = 4;
        let featuredJobs = [];
        let featuredIds = [];
        let featuredFirstPageCount = 0;

        if (page === 1 && limit > 0) {
            const featuredLimit = Math.min(FEATURED_CAP, limit);
            featuredJobs = await Job.findAll({
                where: { ...where, isFeatured: true },
                include,
                order: [["updatedAt", "DESC"]],
                limit: featuredLimit,
            });
            featuredIds = featuredJobs.map((job) => job.id);
            featuredFirstPageCount = featuredJobs.length;
        } else if (page > 1) {
            const featuredTotalMatching = await Job.count({
                where: { ...where, isFeatured: true },
            });
            featuredFirstPageCount = Math.min(FEATURED_CAP, limit, featuredTotalMatching);
        }

        const nonFeaturedOffset = Math.max(offset - (page === 1 ? 0 : featuredFirstPageCount), 0);
        const remainingLimit = page === 1 ? Math.max(limit - featuredFirstPageCount, 0) : limit;

        const nonFeaturedWhere = { ...where };
        if (featuredIds.length) {
            nonFeaturedWhere.id = nonFeaturedWhere.id || {};
            nonFeaturedWhere.id[Op.notIn] = featuredIds;
        }

        let otherJobs = [];
        if (remainingLimit > 0) {
            otherJobs = await Job.findAll({
                where: nonFeaturedWhere,
                include,
                order: [["createdAt", "DESC"]],
                limit: remainingLimit,
                offset: nonFeaturedOffset,
            });
        }

        const jobs = [...featuredJobs, ...otherJobs];

        res.json({
            total,
            page,
            limit,
            jobs,
        });
    } catch (err) {
        console.error("❌ List jobs error:", err);
        res.status(500).json({ error: "Failed to fetch jobs" });
    }
};


// Get single job by ID or slug
exports.getJob = async (req, res) => {
    try {
        const identifier = req.params.identifier || req.params.id;
        const scopedWhere = applyMarketScope({}, req, {
            allowAdminOverride: true,
            allowAllForAdmin: true,
        });
        const include = [
            {
                model: Location,
                as: "jobLocation",
                attributes: [
                    "id",
                    "slug",
                    "name",
                    "city",
                    "state",
                    "country",
                    "countryCode",
                    "latitude",
                    "longitude",
                ],
            },
            {
                model: Company,
                as: "company",
                attributes: [
                    "id",
                    "slug",
                    "name",
                    "logoUrl",
                    "industry",
                    "size",
                    "bannerUrl",
                    "seoTitle",
                    "seoDescription",
                ],
            },
            {
                model: JobCategory,
                as: "jobCategory",
                attributes: ["id", "name", "slug"],
            },
            {
                model: JobCategory,
                as: "jobSubCategory",
                attributes: ["id", "name", "slug"],
            },
            { model: User, as: "poster", attributes: ["id", "username", "email"] },
            {
                model: Skill,
                as: "skillEntities",
                attributes: ["id", "name", "slug", "category", "isFeatured"],
                through: { attributes: [] },
            },
            {
                model: JobIndustry,
                as: "jobIndustry",
                attributes: ["id", "name", "slug"],
            },
            {
                model: JobFunction,
                as: "functions",
                attributes: ["id", "name", "slug", "parentId", "isFeatured"],
                through: { attributes: [] },
                include: [
                    { model: JobFunction, as: "parent", attributes: ["id", "name", "slug"] },
                    { model: JobFunction, as: "children", attributes: ["id", "name", "slug"] },
                ],
            },
        ];

        let job = await findJobByIdentifier(identifier, include, scopedWhere);

        // Localhost cannot infer portal market from hostname, so allow a dev-only fallback
        // to find the job globally by slug/id when the scoped lookup misses.
        if (!job && isLocalDevHost(req)) {
            job = await findJobByIdentifier(identifier, include);
        }

        if (!job) return res.status(404).json({ error: "Job not found" });

        job.views += 1;
        await job.save();

        console.log("📤 [GET JOB] payload excerpt:", {
            id: job.id,
            slug: job.slug,
            responsibilities: job.responsibilities,
            qualifications: job.qualifications,
        });

        res.json(job);
    } catch (err) {
        console.error("❌ Get job error:", err);
        res.status(500).json({ error: "Failed to fetch job" });
    }
};



// Update job
exports.updateJob = async (req, res) => {
    try {
        const job = await Job.findByPk(req.params.id);
        if (!job) return res.status(404).json({ error: "Job not found" });
        const previousStatus = job.status;
        if (req.user.role === "employer") {
            const access = await assertEmployerMarketAccess(req);
            if (!access.ok) {
                return res.status(access.status).json({ error: access.error });
            }
            if (job.companyId !== req.user.companyId) {
                return res.status(403).json({ error: "You can only update jobs for your linked company" });
            }
        }

        const data = req.body;
        console.log("🟡 [UPDATE JOB] Raw body:", data);

        // Convert empty strings → null
        Object.keys(data).forEach((k) => {
            if (data[k] === "") data[k] = null;
        });

        if (data.jobCategoryId) {
            const jobCategory = await JobCategory.findByPk(data.jobCategoryId);
            if (!jobCategory) {
                return res.status(400).json({ error: "Invalid job category selected" });
            }
            data.jobCategoryId = Number(data.jobCategoryId);
        }
        if (data.jobSubCategoryId) {
            const jobSubCategory = await JobCategory.findByPk(data.jobSubCategoryId);
            if (!jobSubCategory) {
                return res.status(400).json({ error: "Invalid job subcategory selected" });
            }
            data.jobSubCategoryId = Number(data.jobSubCategoryId);
        }

        if (data.jobIndustryId) {
            const jobIndustry = await JobIndustry.findByPk(data.jobIndustryId);

            if (!jobIndustry) {
                return res.status(400).json({ error: "Invalid job industry selected" });
            }

            if ((data.market || job.market) && jobIndustry.market && jobIndustry.market !== (data.market || job.market)) {
                return res.status(400).json({
                    error: "Selected industry belongs to a different market",
                });
            }

            data.industry = jobIndustry.name;
            data.jobIndustryId = Number(data.jobIndustryId);
        }
        // File upload (meta image)
        if (req.files?.metaImage) {
            data.metaImage = `/uploads/jobs/meta/${req.files.metaImage[0].filename}`;
        }

        // Parse JSON fields
        data.tags = parseJSON(data.tags, job.tags || []);
        data.faqSchema = parseJSON(data.faqSchema, job.faqSchema || null);
        const company = await Company.findByPk(data.companyId || job.companyId);
        if (!company) {
            return res.status(400).json({ error: "Invalid company selected" });
        }
        if ((data.market || job.market) && company.market && company.market !== (data.market || job.market)) {
            return res.status(400).json({ error: "Selected company belongs to a different market" });
        }

        const companyProfileStrength = buildCompanyProfileStrength(company.toJSON());
        if (req.user.role === "employer" && companyProfileStrength.score < PROFILE_COMPLETION_THRESHOLD) {
            return res.status(403).json({
                error: `Complete your company profile to at least ${PROFILE_COMPLETION_THRESHOLD}% before posting jobs.`,
                profileStrength: companyProfileStrength,
            });
        }

        const resolvedLocationId = data.locationId || job.locationId || company.locationId;
        if (!resolvedLocationId) {
            return res.status(400).json({ error: "Add a primary company location before saving this job." });
        }

        const location = await Location.findByPk(resolvedLocationId);
        if (!location) {
            return res.status(400).json({ error: "Invalid location selected" });
        }
        if ((data.market || job.market) && location.market && location.market !== (data.market || job.market)) {
            return res.status(400).json({ error: "Selected location belongs to a different market" });
        }
        data.locationId = resolvedLocationId;

        const deadline = toDateOrNull(data.deadline || job.deadline);
        if (!deadline) {
            return res.status(400).json({ error: "Application deadline is required" });
        }
        data.deadline = deadline;

        data.salaryMin =
            Object.prototype.hasOwnProperty.call(data, "salaryMin") && data.salaryMin !== null
                ? parseFloat(data.salaryMin)
                : job.salaryMin;
        data.salaryMax =
            Object.prototype.hasOwnProperty.call(data, "salaryMax") && data.salaryMax !== null
                ? parseFloat(data.salaryMax)
                : job.salaryMax;

        const missingJobFields = JOB_REQUIRED_FIELDS.filter((field) => {
            if (field === "companyId") return !(data.companyId || job.companyId);
            if (field === "locationId") return !resolvedLocationId;
            if (field === "type") return !(data.type || job.type);
            if (field === "currency") return !(data.currency || job.currency);
            if (field === "deadline") return !deadline;
            if (field === "salaryMin") return data.salaryMin === null || data.salaryMin === undefined;
            if (field === "salaryMax") return data.salaryMax === null || data.salaryMax === undefined;
            if (field === "title") return !(typeof data.title === "string" ? data.title.trim() : job.title);
            if (field === "description") {
                return !(
                    typeof data.description === "string" ? data.description.trim() : job.description
                );
            }
            return false;
        });
        if (missingJobFields.length) {
            return res.status(400).json({
                error: `Complete the required job details before saving: ${missingJobFields.join(", ")}`,
            });
        }

        const nextTitle = typeof data.title === "string" ? data.title.trim() : job.title;
        const nextDescription =
            typeof data.description === "string" ? data.description.trim() : job.description;
        const copyValidationError = validateJobCopy(nextTitle, nextDescription);
        if (copyValidationError) {
            return res.status(400).json({ error: copyValidationError });
        }
        const salaryValidationError = validateSalaryRange(data.salaryMin, data.salaryMax);
        if (salaryValidationError) {
            return res.status(400).json({ error: salaryValidationError });
        }


        // Default schema type
        if (!data.schemaType) data.schemaType = "JobPosting";
        const fallbackLocationLabel =
            location.name ||
            [location.city, location.state, location.country].filter(Boolean).join(", ") ||
            location.slug ||
            `Location ${location.id}`;
        data.location = clean(data.location) || fallbackLocationLabel;
        data.status = resolveJobStatus(data.status, job.status || "open");

        if (data.slug || data.title || data.location || data.companyId) {
            const targetTitle = data.title || job.title;
            const targetLocation = data.location || job.location;
            const targetCompanyId = data.companyId || job.companyId;
            let targetCompanyName = null;

            if (targetCompanyId) {
                const companyRecord = await Company.findByPk(targetCompanyId, {
                    attributes: ["name"],
                });
                targetCompanyName = companyRecord?.name || null;
            }

            const slugSeed = data.slug || buildSlugSeed({
                title: targetTitle,
                companyName: targetCompanyName,
                location: targetLocation,
            });

            data.slug = await generateUniqueSlug(slugSeed, job.id, data.market || job.market);
        }

        const skillIds = normalizeIds(req.body.skillIds || req.body.skill_entities || req.body.skillEntities);
        const functionIds = normalizeIds(req.body.functionIds || req.body.functions || req.body.functionEntities);

        // 🔒 Employer plan enforcement (admins bypass)
        if (req.user?.role === "employer") {
            const companyId = req.user.companyId || job.companyId;
            const features = await getEmployerPlanFeatures(companyId);
            if (!features) {
                return res.status(402).json({ error: "No active plan found for this employer." });
            }
            const targetStatus = resolveJobStatus(data.status, job.status || "open");
            const isPublishingLiveJob = targetStatus === "open";

            if (isPublishingLiveJob && !isFeatureEnabled(features.can_post_jobs)) {
                return res.status(403).json({ error: "Your plan does not allow posting jobs." });
            }

            const maxJobs = parseFeatureNumber(features.max_jobs, null);
            const isNewLiveSlot = job.status !== "open" && isPublishingLiveJob;
            if (isNewLiveSlot && Number.isFinite(maxJobs)) {
                const activeJobs = await Job.count({ where: { companyId, status: "open" } });
                if (activeJobs >= maxJobs) {
                    return res.status(403).json({ error: "Job posting limit reached for your plan." });
                }
            }

            const wantsFeatured = data.isFeatured === true || data.isFeatured === "true";
            if (isPublishingLiveJob && wantsFeatured && !job.isFeatured) {
                if (!isFeatureEnabled(features.can_feature_jobs)) {
                    return res.status(403).json({ error: "Your plan does not allow featured jobs." });
                }
                const featuredLimit = parseFeatureNumber(features.featured_jobs_limit, 0);
                if (featuredLimit > 0) {
                    const featuredCount = await Job.count({ where: { companyId, isFeatured: true, status: "open" } });
                    if (featuredCount >= featuredLimit) {
                        return res.status(403).json({ error: "Featured job limit reached for your plan." });
                    }
                }
            }
        }

        // Update job
        normalizeWalkInFields(data);
        await job.update(data);

        if (skillIds.length && job.setSkillEntities) {
            await job.setSkillEntities(skillIds);
        } else if (req.body.skillIds || req.body.skill_entities || req.body.skillEntities) {
            await job.setSkillEntities([]);
        }

        if (functionIds.length && job.setFunctions) {
            await job.setFunctions(functionIds);
        } else if (req.body.functionIds || req.body.functions || req.body.functionEntities) {
            await job.setFunctions([]);
        }

        const companyRecord = await Company.findByPk(job.companyId, {
            attributes: ["id", "name", "slug"],
        });
        const poster = job.postedBy
            ? await User.findByPk(job.postedBy, {
                attributes: ["id", "email", "firstName", "lastName", "username"],
            })
            : null;

        if (req.user.role === "admin" && poster?.email && data.status && data.status !== previousStatus) {
            const employerName =
                `${poster.firstName || ""} ${poster.lastName || ""}`.trim() ||
                poster.username ||
                poster.email ||
                "there";
            const siteUrl = getSiteUrl();
            const jobUrl = job.slug ? `${siteUrl}/jobs/${job.slug}` : `${siteUrl}/jobs`;

            if (data.status === "open" && previousStatus !== "open") {
                sendTemplateMail({
                    template: "jobApproved",
                    to: poster.email,
                    data: {
                        employerName,
                        companyName: companyRecord?.name || "",
                        jobTitle: job.title,
                        location: job.location || "",
                        jobType: job.type || "",
                        salaryText: formatSalaryText(job),
                        approvedAt: new Date(),
                        publishedAt: new Date(),
                        jobUrl,
                        dashboardJobUrl: getEmployerDashboardUrl(),
                        applicationsUrl: getEmployerApplicantsUrl(),
                    },
                }).catch((mailErr) =>
                    console.warn("⚠️ [MAILER] Job approved email failed:", mailErr.message)
                );
            }

            if (data.status === "closed" && previousStatus === "draft") {
                sendTemplateMail({
                    template: "jobRejected",
                    to: poster.email,
                    data: {
                        employerName,
                        companyName: companyRecord?.name || "",
                        jobTitle: job.title,
                        location: job.location || "",
                        jobType: job.type || "",
                        salaryText: formatSalaryText(job),
                        reviewedAt: new Date(),
                        reason: clean(req.body.reviewReason) || "",
                        requiredAction: clean(req.body.requiredAction) || "",
                        editJobUrl: getEmployerDashboardUrl(),
                        dashboardJobUrl: getEmployerDashboardUrl(),
                    },
                }).catch((mailErr) =>
                    console.warn("⚠️ [MAILER] Job rejected email failed:", mailErr.message)
                );
            }
        }

        console.log("✅ [UPDATE JOB] Updated successfully:", job.id);

        res.json(job);
    } catch (err) {
        console.error("❌ Update job error:", err);
        res.status(500).json({ error: "Failed to update job", details: err.message });
    }
};

// Delete job
exports.deleteJob = async (req, res) => {
    try {
        const job = await Job.findByPk(req.params.id);
        if (!job) return res.status(404).json({ error: "Job not found" });

        await job.destroy();
        res.json({ message: "Job deleted successfully" });
    } catch (err) {
        console.error("❌ Delete job error:", err);
        res.status(500).json({ error: "Failed to delete job" });
    }
};

// In jobController.js
exports.listJobsByCompany = async (req, res) => {
    try {
        const companyId = req.params.companyId;
        const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 50);
        const jobs = await Job.findAll({
            where: applyMarketScope({ companyId }, req, {
                allowAdminOverride: true,
                allowAllForAdmin: true,
            }),
            include: [
                {
                    model: Company,
                    as: "company", // 👈 important alias
                    attributes: ["id", "name", "slug", "logoUrl", "industry"],
                },
                {
                    model: JobIndustry,
                    as: "jobIndustry",
                    attributes: ["id", "name", "slug"],
                },
                { model: JobCategory, as: "jobCategory", attributes: ["id", "name", "slug"] },
                { model: JobCategory, as: "jobSubCategory", attributes: ["id", "name", "slug"] },
            ],
            order: [["createdAt", "DESC"]],
            limit,
        });
        res.json(jobs);
    } catch (err) {
        console.error("❌ Jobs by company error:", err);
        res.status(500).json({ error: "Failed to fetch jobs for this company" });
    }
};

exports.getAllJobsAdmin = async (req, res) => {
    try {
        const { page = 1, limit = 12, search = "" } = req.query;
        const limitNum = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 200);
        const offset = (page - 1) * limitNum;

        const where = applyMarketScope({}, req, {
            allowAdminOverride: true,
            allowAllForAdmin: true,
        });
        if (search.trim()) {
            where[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { type: { [Op.like]: `%${search}%` } },
            ];
        }

        const { rows, count } = await Job.findAndCountAll({
            where,
            include: [
                {
                    model: Company,
                    as: "company", // ✅ required alias
                    attributes: ["id", "name", "slug"],
                },
                {
                    model: JobCategory,
                    as: "jobCategory",
                    attributes: ["id", "name", "slug"],
                },
                {
                    model: JobIndustry,
                    as: "jobIndustry",
                    attributes: ["id", "name", "slug"],
                },
                {
                    model: JobCategory,
                    as: "jobSubCategory",
                    attributes: ["id", "name", "slug"],
                },
                {
                    model: Location,
                    as: "jobLocation", // ✅ required alias
                    attributes: ["id", "name"],
                },
            ],
            order: [["createdAt", "DESC"]],
            offset,
            limit: limitNum,
        });

        res.json({
            jobs: rows,
            total: count,
            totalPages: Math.ceil(count / limitNum),
            page: parseInt(page),
        });
    } catch (err) {
        console.error("❌ getAllJobsAdmin error:", err);
        res.status(500).json({ error: "Failed to fetch jobs" });
    }
};

// ============================================================
// 🟣 Get Related Jobs
// ============================================================
exports.getRelatedJobs = async (req, res) => {
    const { identifier } = req.params;

    try {
        // Find the base job first
        const job = await findJobByIdentifier(
            identifier,
            [],
            applyMarketScope({}, req, {
                allowAdminOverride: true,
                allowAllForAdmin: true,
            })
        );

        if (!job) {
            return res.status(404).json({ error: "Job not found" });
        }

        // Build where clause for related jobs
        const where = {
            id: { [Op.ne]: job.id }, // exclude current job
            status: "open",
            [Op.or]: [],
        };
        applyMarketScope(where, req, {
            allowAdminOverride: true,
            allowAllForAdmin: true,
        });

        // Match by industry
        if (job.industry) {
            where[Op.or].push({ industry: job.industry });
        }

        // Match by location
        if (job.location) {
            where[Op.or].push({ location: { [Op.like]: `%${job.location}%` } });
        }

        // Match by title keyword (first word)
        if (job.title) {
            const keyword = job.title.split(" ")[0];
            where[Op.or].push({ title: { [Op.like]: `%${keyword}%` } });
        }

        // Fallback to general open jobs if no criteria found
        if (!where[Op.or].length) {
            delete where[Op.or];
        }

        // Query related jobs
        const relatedJobs = await Job.findAll({
            where,
            include: [
                {
                    model: Company,
                    as: "company",
                    attributes: ["id", "name", "slug", "logoUrl", "industry"],
                },
            ],
            order: [["createdAt", "DESC"]],
            limit: 5,
        });

        res.json(relatedJobs);
    } catch (err) {
        console.error("❌ Related jobs error:", err);
        res.status(500).json({ error: "Failed to fetch related jobs" });
    }
};
