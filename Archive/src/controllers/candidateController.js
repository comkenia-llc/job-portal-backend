"use strict";
const { CandidateProfile, User, Resume } = require("../models");
const { Op } = require("sequelize");

const normalizeList = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(Boolean).map((s) => String(s).trim());
    if (typeof val === "string") {
        try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) return parsed.filter(Boolean).map((s) => String(s).trim());
        } catch (_) {
            /* fall through */
        }
        return val
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
    }
    return [];
};

const mapCandidate = (userJson, resumeJson = {}) => {
    const profile = userJson.candidateProfile || {};
    const resume = resumeJson || {};
    const resumeInfo = resume.personalInfo || {};
    const resumeExperience = Array.isArray(resume.experience) ? resume.experience : [];
    const resumeSkills = normalizeList(resume.skills);
    const resumeLanguages = normalizeList(resume.languages);

    const expYearsFromResume = resumeExperience.reduce((sum, exp) => {
        if (!exp?.startDate) return sum;
        const startDate = new Date(exp.startDate);
        const endDate = exp.endDate ? new Date(exp.endDate) : new Date();
        const years = (endDate - startDate) / (1000 * 60 * 60 * 24 * 365);
        return sum + (isFinite(years) ? years : 0);
    }, 0);
    const roundedExpYears = expYearsFromResume ? Math.max(1, Math.round(expYearsFromResume)) : null;

    return {
        id: userJson.id,
        slug: userJson.username,
        username: userJson.username,
        email: userJson.email,
        role: userJson.role,
        avatarUrl: userJson.avatarUrl || profile.avatarUrl || resume.photoUrl || resumeInfo.photoUrl || null,
        firstName: profile.firstName || userJson.firstName || resumeInfo.firstName,
        lastName: profile.lastName || userJson.lastName || resumeInfo.lastName,
        headline: profile.headline || userJson.headline || resumeInfo.jobTitle || resume.title || null,
        phone: profile.phone || userJson.phone || resumeInfo.phone || null,
        location: profile.location || userJson.location || resumeInfo.location || null,
        about: profile.bio || userJson.about || resume.summary || null,
        experienceYears: profile.experienceYears ?? userJson.experienceYears ?? roundedExpYears,
        skills: normalizeList(profile.skills || userJson.skills || resumeSkills),
        languages: normalizeList(profile.languages || userJson.languages || resumeLanguages),
        isAvailable: profile.isAvailable,
        preferredJobType: profile.preferredJobType,
        expectedSalaryMin: profile.expectedSalaryMin,
        expectedSalaryMax: profile.expectedSalaryMax,
        currency: profile.currency || "USD",
        resumeId: resume.id || null,
        candidateProfile: profile,
    };
};

let callCounter = 0;
exports.listCandidates = async (req, res) => {
    try {
        const callId = ++callCounter;
        const start = Date.now();
        res.once("finish", () => {
            console.log("👥 [Candidates] finished response", {
                callId,
                statusCode: res.statusCode,
                headersSent: res.headersSent,
                durationMs: Date.now() - start,
                writableEnded: res.writableEnded,
            });
        });
        res.once("close", () => {
            console.log("👥 [Candidates] response stream closed", {
                callId,
                headersSent: res.headersSent,
                writableEnded: res.writableEnded,
            });
        });

        console.log("👥 [Candidates] incoming query", {
            callId,
            rawQuery: req.query,
            cookies: Object.keys(req.cookies || {}),
            authUser: req.user || null,
            headersSentAtStart: res.headersSent,
        });
        if (res.headersSent) {
            console.warn("⚠️ [Candidates] headers already sent at start", { callId });
            console.trace("stack at headersSentStart");
            return;
        }
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit, 10) || 12, 50);
        const offset = (page - 1) * limit;
        const keyword = req.query.keyword || "";
        const keywordLc = keyword.toLowerCase();
        const location = (req.query.location || "").trim();

        const userWhere = {
            role: "candidate",
            [Op.or]: [{ status: "active" }, { status: null }],
        };
        const profileWhere = {};

        // Avoid DB-level keyword filter so JSON/array skills aren't excluded prematurely; filter in-memory later.

        const applyFilter = Boolean(keyword.trim() || location.trim());

        const findOptions = {
            where: userWhere,
            include: [
                {
                    model: CandidateProfile,
                    as: "candidateProfile",
                    where: Object.keys(profileWhere).length ? profileWhere : undefined,
                    required: false,
                    attributes: {
                        exclude: ["createdAt", "updatedAt"],
                    },
                },
            ],
            attributes: [
                "id",
                "username",
                "email",
                "role",
                "firstName",
                "lastName",
                "avatarUrl",
                "headline",
                "phone",
                "location",
                "about",
            ],
            order: [["createdAt", "DESC"]],
        };
        if (!applyFilter) {
            findOptions.limit = limit;
            findOptions.offset = offset;
        }

        console.log("👥 [Candidates] findOptions", {
            callId,
            where: findOptions.where,
            profileWhere: findOptions.include?.[0]?.where,
            limit,
            offset,
        });

        console.log("⌛ [Candidates] querying DB…", { callId });
        const { rows, count } = await User.findAndCountAll(findOptions);
        console.log("✅ [Candidates] DB query done", {
            callId,
            rows: rows.length,
            count,
            durationMs: Date.now() - start,
        });

        // Fetch latest/default resumes to enrich data
        const userIds = rows.map((u) => u.id);
        let resumeByUser = {};
        if (userIds.length) {
            const resumeRecords = await Resume.findAll({
                where: { userId: userIds },
                order: [
                    ["isDefault", "DESC"],
                    ["updatedAt", "DESC"],
                ],
                attributes: ["id", "userId", "personalInfo", "summary", "experience", "skills", "languages", "lastGeneratedPdf", "photoUrl", "title"],
            });
            for (const r of resumeRecords) {
                const uid = r.userId;
                if (!resumeByUser[uid]) {
                    resumeByUser[uid] = r.toJSON();
                }
            }
        }

        console.log("👥 [Candidates] query", {
            callId,
            page,
            limit,
            keyword,
            location,
            found: rows.length,
            total: count,
        });

        const items = rows.map((user) => mapCandidate(user.toJSON(), resumeByUser[user.id]));

        const filteredItems = items.filter((c) => {
            const haystack = [
                c.username,
                `${c.firstName || ""} ${c.lastName || ""}`,
                c.headline,
                c.about,
                c.location,
                c.preferredJobType,
                c.skills?.join(" "),
                c.languages?.join(" "),
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const haystackNormalized = haystack.replace(/[-_]/g, " ");
            const keywordNormalized = keywordLc.trim().replace(/[-_]/g, " ");

            const locationMatches =
                location.trim().length === 0 ||
                (c.location || "").toLowerCase().includes(location.toLowerCase());

            const keywordMatches =
                keywordNormalized.length === 0 ? true : haystackNormalized.includes(keywordNormalized);

            return keywordMatches && locationMatches;
        });

        const effectiveTotal = applyFilter ? filteredItems.length : count;
        const totalPages = Math.max(1, Math.ceil(effectiveTotal / limit));
        const pageStart = (page - 1) * limit;
        const pagedItems = applyFilter ? filteredItems.slice(pageStart, pageStart + limit) : filteredItems;

        const payload = {
            items: pagedItems,
            total: effectiveTotal,
            page,
            totalPages,
        };

        console.log("👥 [Candidates] responding with", {
            callId,
            items: payload.items.length,
            total: payload.total,
            page: payload.page,
            totalPages: payload.totalPages,
            headersSent: res.headersSent,
            statusCode: res.statusCode,
        });

        // Force a 200 JSON response for this route
        return res.status(200).json(payload);
    } catch (err) {
        console.error("❌ listCandidates error", err);
        if (res.headersSent) {
            // Avoid double-send; just log
            console.error("⚠️ Headers already sent, skipping error response");
            return;
        }
        return res.status(500).json({
            message: "Failed to fetch candidates",
            error: err.message,
            stack: err.stack,
        });
    }
};

exports.getCandidateBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const asNumber = /^\d+$/.test(slug) ? Number(slug) : null;

        const user = await User.findOne({
            where: {
                role: "candidate",
                [Op.and]: [
                    { [Op.or]: [{ status: "active" }, { status: null }] },
                    { [Op.or]: [{ username: slug }, ...(asNumber ? [{ id: asNumber }] : [])] },
                ],
            },
            include: [
                {
                    model: CandidateProfile,
                    as: "candidateProfile",
                    required: false,
                    attributes: { exclude: ["createdAt", "updatedAt"] },
                },
            ],
            attributes: [
                "id",
                "username",
                "email",
                "role",
                "firstName",
                "lastName",
                "avatarUrl",
                "headline",
                "phone",
                "location",
                "about",
            ],
        });

        if (!user) {
            return res.status(404).json({ message: "Candidate not found" });
        }

        const resume = await Resume.findOne({
            where: { userId: user.id },
            order: [
                ["isDefault", "DESC"],
                ["updatedAt", "DESC"],
            ],
            attributes: ["id", "userId", "personalInfo", "summary", "experience", "skills", "languages", "lastGeneratedPdf", "photoUrl", "title"],
        });

        const candidate = mapCandidate(user.toJSON(), resume ? resume.toJSON() : {});
        return res.json({ candidate });
    } catch (err) {
        console.error("❌ getCandidateBySlug error", err);
        return res.status(500).json({ message: "Failed to fetch candidate", error: err.message });
    }
};
