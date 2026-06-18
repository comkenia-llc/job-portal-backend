const { User, Company } = require("../models");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const path = require("path");
const { resolveRequestMarket } = require("../utils/market");
const {
    sendTemplateMail,
    getSiteUrl,
    getCandidateDashboardUrl,
    getCandidateAlertsUrl,
    getCandidateProfileUrl,
    getEmployerDashboardUrl,
    getEmployerSettingsUrl,
    getPostJobUrl,
} = require("../services/mailTemplateService");
const {
    ensureDefaultEmployerPlan,
    assignDefaultEmployerPlan,
} = require("../services/employerPlanService");

const resolveUserId = (rawId) =>
    typeof rawId === "object" && rawId?.id ? rawId.id : rawId;

const shouldPersistMarketPreference = (resolvedMarket) =>
    Boolean(
        resolvedMarket?.market &&
        resolvedMarket.source === "request-host" &&
        resolvedMarket.market !== "global"
    );

const EMAIL_VERIFICATION_CODE_LENGTH = 5;
const EMAIL_VERIFICATION_EXPIRY_MINUTES = 10;
const EMPLOYER_DASHBOARD_PATH = "/companies/dashboard";
const EMPLOYER_ONBOARDING_CREATE_COMPANY_PATH = `/companies/create?onboarding=1&redirect=${encodeURIComponent(
    EMPLOYER_DASHBOARD_PATH
)}`;

const generateVerificationCode = () =>
    String(Math.floor(Math.random() * 10 ** EMAIL_VERIFICATION_CODE_LENGTH)).padStart(
        EMAIL_VERIFICATION_CODE_LENGTH,
        "0"
    );

const hashVerificationCode = (code) =>
    crypto.createHash("sha256").update(String(code)).digest("hex");

const getUserDisplayName = (user) =>
    user?.firstName ||
    user?.username ||
    user?.email?.split("@")[0] ||
    "there";

const setEmailVerificationCode = async (user) => {
    const code = generateVerificationCode();
    const expiresAt = new Date(
        Date.now() + EMAIL_VERIFICATION_EXPIRY_MINUTES * 60 * 1000
    );

    user.emailVerificationCodeHash = hashVerificationCode(code);
    user.emailVerificationCodeExpiresAt = expiresAt;
    await user.save();

    return {
        code,
        expiresAt,
    };
};

const buildTokenPayload = (user) => {
    const payload = {
        id: user.id,
        role: user.role,
    };

    if (user.company_id) {
        payload.companyId = user.company_id;
    }

    return payload;
};

const issueAuthSession = (res, user) => {
    const token = jwt.sign(buildTokenPayload(user), process.env.JWT_SECRET, {
        expiresIn: "7d",
    });

    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return token;
};

const buildAuthUserResponse = (plainUser, linkedCompany = null, requestMarket = null) => ({
    id: plainUser.id,
    username: plainUser.username,
    email: plainUser.email,
    role: plainUser.role,
    status: plainUser.status,
    companyId: plainUser.company_id || null,
    companyMarket: linkedCompany?.market || null,
    preferredMarket: plainUser.preferredMarket || null,
    firstName: plainUser.firstName || null,
    lastName: plainUser.lastName || null,
    avatarUrl: plainUser.avatarUrl || null,
    emailVerified: plainUser.emailVerified,
    currentMarket: requestMarket || null,
});

const resolvePostAuthRedirect = (plainUser) => {
    if (plainUser.role === "admin") {
        return "/admin";
    }

    if (plainUser.role === "employer") {
        return plainUser.company_id
            ? EMPLOYER_DASHBOARD_PATH
            : EMPLOYER_ONBOARDING_CREATE_COMPANY_PATH;
    }

    return "/dashboard";
};

// ============================================
// 🔹 Register User
// ============================================
exports.register = async (req, res) => {
    console.log("📝 [REGISTER] Incoming request body:", req.body);
    try {
        const { username, email, password, role } = req.body;
        const resolvedMarket = resolveRequestMarket(req, {
            allowAdminOverride: false,
        });

        // Validation
        if (!username || !email || !password) {
            console.warn("⚠️ [REGISTER] Missing required fields.");
            return res
                .status(400)
                .json({ error: "Username, email and password required" });
        }

        // Check existing
        const existing = await User.findOne({
            where: { [Op.or]: [{ email }, { username }] },
        });
        if (existing) {
            console.warn("⚠️ [REGISTER] User already exists:", existing.email);
            return res.status(409).json({ error: "User already exists" });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);
        console.log("🔐 [REGISTER] Password hashed successfully.");

        // Create user
        const user = await User.create({
            username,
            email,
            passwordHash,
            role: role || "candidate",
            status: "active",
            preferredMarket: shouldPersistMarketPreference(resolvedMarket)
                ? resolvedMarket.market
                : null,
        });

        const { code } = await setEmailVerificationCode(user);

        sendTemplateMail({
            template: "emailVerificationCode",
            to: user.email,
            data: {
                name: getUserDisplayName(user),
                code,
                expiresInMinutes: EMAIL_VERIFICATION_EXPIRY_MINUTES,
            },
        }).catch((mailErr) =>
            console.warn("⚠️ [MAILER] Verification email failed:", mailErr.message)
        );

        console.log("✅ [REGISTER] User created:", {
            id: user.id,
            email: user.email,
            role: user.role,
        });

        res.status(201).json({
            message: "Registration successful",
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                preferredMarket: user.preferredMarket || null,
                emailVerified: user.emailVerified,
            },
            verificationRequired: true,
        });
    } catch (err) {
        console.error("❌ [REGISTER] Error:", err);
        res.status(500).json({ error: "Failed to register user" });
    }
};

// ============================================
// 🔹 Login User
// ============================================
exports.login = async (req, res) => {
    console.log("🔑 [LOGIN] Attempting login for:", req.body.emailOrUsername);
    console.log("🔑 [LOGIN] Raw body:", req.body);

    try {
        const { emailOrUsername, password } = req.body;

        // 1️⃣ Find user by email or username
        const user = await User.findOne({
            where: {
                [Op.or]: [{ email: emailOrUsername }, { username: emailOrUsername }],
            },
        });

        if (!user) {
            console.warn("⚠️ [LOGIN] User not found:", emailOrUsername);
            return res.status(404).json({ error: "User not found" });
        }

        // 2️⃣ Validate password
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            console.warn("⚠️ [LOGIN] Invalid password for:", emailOrUsername);
            return res.status(400).json({ error: "Invalid credentials" });
        }

        if (!user.emailVerified && user.emailVerificationCodeHash) {
            return res.status(403).json({
                error: "Email verification required",
                verificationRequired: true,
                email: user.email,
                role: user.role,
            });
        }

        const resolvedMarket = resolveRequestMarket(req, {
            allowAdminOverride: false,
        });
        const requestMarket = resolvedMarket.market;

        // 3️⃣ Flatten instance
        const plainUser = user.get({ plain: true });
        let linkedCompany = null;
        if (plainUser.company_id) {
            linkedCompany = await Company.findByPk(plainUser.company_id, {
                attributes: ["id", "name", "market", "slug"],
            });
        }

        if (
            plainUser.role === "employer" &&
            linkedCompany?.market &&
            requestMarket &&
            linkedCompany.market !== requestMarket
        ) {
            return res.status(403).json({
                error: "This employer account is assigned to a different portal market",
                companyMarket: linkedCompany.market,
                requestMarket,
            });
        }

        if (
            plainUser.role === "candidate" &&
            plainUser.preferredMarket &&
            shouldPersistMarketPreference(resolvedMarket) &&
            plainUser.preferredMarket !== requestMarket
        ) {
            return res.status(403).json({
                error: "This candidate account is assigned to a different portal market",
                preferredMarket: plainUser.preferredMarket,
                requestMarket,
            });
        }

        if (
            !plainUser.preferredMarket &&
            plainUser.role !== "admin" &&
            shouldPersistMarketPreference(resolvedMarket)
        ) {
            await user.update({ preferredMarket: requestMarket });
            plainUser.preferredMarket = requestMarket;
        }
        console.log("👤 [LOGIN] Authenticated user:", {
            id: plainUser.id,
            role: plainUser.role,
            company_id: plainUser.company_id,
            preferredMarket: plainUser.preferredMarket || null,
        });

        // 4️⃣ Prepare token payload
        if (plainUser.company_id) {
            console.log("✅ [LOGIN] User linked to company:", plainUser.company_id);
        } else if (plainUser.role === "employer") {
            console.warn("⚠️ [LOGIN] Employer has no company linked!");
        }

        // 5️⃣ Sign JWT + set cookie
        const token = issueAuthSession(res, plainUser);

        console.log("🪪 [LOGIN] JWT payload used:", buildTokenPayload(plainUser));

        // 7️⃣ Respond
        res.json({
            message: "Login successful",
            token,
            user: buildAuthUserResponse(plainUser, linkedCompany, requestMarket),
        });

        console.log("✅ [LOGIN] Login success for user ID:", plainUser.id);
    } catch (err) {
        console.error("❌ [LOGIN] Unexpected error:", err);
        res.status(500).json({ error: "Server error during login" });
    }
};

// ============================================
// 🔹 Verify Email
// ============================================
exports.verifyEmail = async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({ error: "Email and code are required" });
        }

        const user = await User.findOne({ where: { email: email.trim() } });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.emailVerified) {
            return res.json({ message: "Email already verified" });
        }

        if (
            !user.emailVerificationCodeHash ||
            !user.emailVerificationCodeExpiresAt
        ) {
            return res.status(400).json({ error: "Verification code not found" });
        }

        if (new Date(user.emailVerificationCodeExpiresAt) < new Date()) {
            return res.status(400).json({ error: "Verification code has expired" });
        }

        if (hashVerificationCode(code.trim()) !== user.emailVerificationCodeHash) {
            return res.status(400).json({ error: "Invalid verification code" });
        }

        user.emailVerified = true;
        user.emailVerificationCodeHash = null;
        user.emailVerificationCodeExpiresAt = null;
        await user.save();

        if (user.role === "employer") {
            await ensureDefaultEmployerPlan();
            if (user.company_id) {
                await assignDefaultEmployerPlan(user.company_id);
            }
        }

        sendTemplateMail({
            template: "welcomeEmail",
            to: user.email,
            data: {
                name: getUserDisplayName(user),
                accountType: user.role || "candidate",
                dashboardUrl: getCandidateDashboardUrl(),
                employerDashboardUrl: getEmployerDashboardUrl(),
                jobsUrl: `${getSiteUrl()}/jobs`,
                walkInUrl: `${getSiteUrl()}/walk-in-interviews`,
                companiesUrl: `${getSiteUrl()}/companies`,
                jobAlertsUrl: getCandidateAlertsUrl(),
                profileUrl: getCandidateProfileUrl(),
                resumeBuilderUrl: `${getSiteUrl()}/dashboard/resumes/builder`,
                postJobUrl: getPostJobUrl(),
                companyProfileUrl: getEmployerSettingsUrl(),
            },
        }).catch((mailErr) =>
            console.warn("⚠️ [MAILER] Welcome email failed:", mailErr.message)
        );

        const plainUser = user.get({ plain: true });
        const requestMarket = resolveRequestMarket(req, {
            allowAdminOverride: plainUser.role === "admin",
        }).market;
        let linkedCompany = null;
        if (plainUser.company_id) {
            linkedCompany = await Company.findByPk(plainUser.company_id, {
                attributes: ["id", "name", "market", "slug"],
            });
        }

        const token = issueAuthSession(res, plainUser);

        res.json({
            message: "Email verified successfully",
            token,
            user: buildAuthUserResponse(plainUser, linkedCompany, requestMarket),
            redirectTo: resolvePostAuthRedirect(plainUser),
        });
    } catch (err) {
        console.error("❌ [VERIFY EMAIL] Error:", err);
        res.status(500).json({ error: "Failed to verify email" });
    }
};

// ============================================
// 🔹 Resend Verification Code
// ============================================
exports.resendVerificationCode = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        const user = await User.findOne({ where: { email: email.trim() } });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.emailVerified) {
            return res.status(400).json({ error: "Email already verified" });
        }

        const { code } = await setEmailVerificationCode(user);

        await sendTemplateMail({
            template: "resendVerification",
            to: user.email,
            data: {
                name: getUserDisplayName(user),
                code,
                expiresInMinutes: EMAIL_VERIFICATION_EXPIRY_MINUTES,
                requestedAt: new Date(),
            },
        });

        res.json({ message: "Verification code sent" });
    } catch (err) {
        console.error("❌ [RESEND VERIFY] Error:", err);
        res.status(500).json({ error: "Failed to resend verification code" });
    }
};


// ============================================
// 🔹 Logout User
// ============================================
exports.logout = async (req, res) => {
    try {
        console.log("🚪 [LOGOUT] Clearing cookie for user:", req.user?.id);
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        });
        res.json({ message: "Logged out successfully" });
    } catch (err) {
        console.error("❌ [LOGOUT] Error:", err);
        res.status(500).json({ error: "Logout failed" });
    }
};

// ============================================
// 🔹 Get Current User (/me)
// ============================================
exports.me = async (req, res) => {
    try {
        console.log("👁 [ME] Requesting current user. Decoded token:", req.user);

        // Fix for nested ID bug (id: { id: 3 })
        const userId = resolveUserId(req.user.id);

        console.log("🔍 [ME] Fetching user with ID:", userId);

        const user = await User.findByPk(userId, {
            attributes: { exclude: ["passwordHash"] },
            include: [
                {
                    association: "candidateProfile",
                    attributes: {
                        exclude: ["createdAt", "updatedAt"],
                    },
                    required: false,
                },
            ],
        });

        if (!user) {
            console.warn("⚠️ [ME] User not found in database:", userId);
            return res.status(404).json({ error: "User not found" });
        }

        console.log("✅ [ME] User fetched successfully:", {
            id: user.id,
            role: user.role,
        });

        const requestMarket = resolveRequestMarket(req, {
            allowAdminOverride: req.user?.role === "admin",
        }).market;
        let company = null;
        if (user.company_id) {
            company = await Company.findByPk(user.company_id, {
                attributes: ["id", "name", "slug", "market"],
            });
        }

        res.json({
            ...user.toJSON(),
            currentMarket: requestMarket || null,
            company,
        });
    } catch (err) {
        console.error("❌ [ME] Error:", err);
        res.status(500).json({ error: "Failed to fetch user" });
    }
};

// ============================================
// 🔹 Update Own Profile
// ============================================
exports.updateProfile = async (req, res) => {
    try {
        const userId = resolveUserId(req.user.id);

        const {
            username,
            email,
            firstName,
            lastName,
            avatarUrl,
            headline,
            phone,
            location,
            linkedinUrl,
            portfolioUrl,
            about,
            experienceYears,
            skills,
            languages,
            preferredJobType,
            isAvailable,
            expectedSalaryMin,
            expectedSalaryMax,
            currency,
            dateOfBirth,
            gender,
            nationality,
            workHistory,
            educationHistory,
            certifications,
        } = req.body;

        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        if (email && email !== user.email) {
            const existingEmail = await User.findOne({ where: { email } });
            if (existingEmail && existingEmail.id !== user.id) {
                return res.status(409).json({ error: "Email already in use" });
            }
        }

        if (username && username !== user.username) {
            const existingUsername = await User.findOne({ where: { username } });
            if (existingUsername && existingUsername.id !== user.id) {
                return res.status(409).json({ error: "Username already in use" });
            }
        }

        await user.update({
            username: username?.trim() || user.username,
            email: email?.trim() || user.email,
            firstName: firstName?.trim() || null,
            lastName: lastName?.trim() || null,
            avatarUrl: avatarUrl?.trim() || null,
            headline: headline?.trim() || null,
            phone: phone?.trim() || null,
            location: location?.trim() || null,
            linkedinUrl: linkedinUrl?.trim() || null,
            portfolioUrl: portfolioUrl?.trim() || null,
            about: about?.trim() || null,
        });

        // Update or create candidate profile for candidate users
        if (user.role === "candidate") {
            const { CandidateProfile } = require("../models");
            const [profile] = await CandidateProfile.findOrCreate({
                where: { userId },
                defaults: { userId },
            });

            const toArray = (val) => {
                if (!val) return [];
                if (Array.isArray(val)) return val;
                if (typeof val === "string") return val.split(",").map((s) => s.trim()).filter(Boolean);
                return [];
            };
            const toJson = (val, fallback) => {
                if (val === undefined || val === null || val === "") return fallback;
                if (typeof val === "string") {
                    try {
                        return JSON.parse(val);
                    } catch (_) {
                        return fallback;
                    }
                }
                return val;
            };

            await profile.update({
                firstName: firstName?.trim() || profile.firstName || null,
                lastName: lastName?.trim() || profile.lastName || null,
                phone: phone?.trim() || profile.phone || null,
                email: email?.trim() || profile.email || null,
                location: location?.trim() || profile.location || null,
                headline: headline?.trim() || profile.headline || null,
                bio: about?.trim() || profile.bio || null,
                experienceYears:
                    experienceYears !== undefined && experienceYears !== null
                        ? Number(experienceYears)
                        : profile.experienceYears,
                skills: toArray(skills) || profile.skills || [],
                languages: toArray(languages) || profile.languages || [],
                preferredJobType: preferredJobType || profile.preferredJobType || null,
                isAvailable:
                    typeof isAvailable === "boolean"
                        ? isAvailable
                        : profile.isAvailable,
                expectedSalaryMin:
                    expectedSalaryMin !== undefined && expectedSalaryMin !== null
                        ? Number(expectedSalaryMin)
                        : profile.expectedSalaryMin,
                expectedSalaryMax:
                    expectedSalaryMax !== undefined && expectedSalaryMax !== null
                        ? Number(expectedSalaryMax)
                        : profile.expectedSalaryMax,
                currency: currency || profile.currency || "USD",
                dateOfBirth: dateOfBirth || profile.dateOfBirth || null,
                gender: gender || profile.gender || null,
                nationality: nationality || profile.nationality || null,
                workHistory: toJson(workHistory, profile.workHistory),
                educationHistory: toJson(educationHistory, profile.educationHistory),
                certifications: toJson(certifications, profile.certifications),
            });
        }

        const updatedUser = await User.findByPk(userId, {
            attributes: { exclude: ["passwordHash"] },
            include: [
                {
                    association: "candidateProfile",
                    attributes: { exclude: ["createdAt", "updatedAt"] },
                    required: false,
                },
            ],
        });

        res.json({
            message: "Profile updated successfully",
            user: updatedUser,
        });
    } catch (err) {
        console.error("❌ [PROFILE] updateProfile error:", err);
        res.status(500).json({ error: "Failed to update profile" });
    }
};

// ============================================
// 🔹 Update Password
// ============================================
exports.updatePassword = async (req, res) => {
    try {
        const userId = resolveUserId(req.user.id);

        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res
                .status(400)
                .json({ error: "Current and new password are required" });
        }

        if (newPassword.length < 8) {
            return res
                .status(400)
                .json({ error: "New password must be at least 8 characters" });
        }

        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValid) {
            return res.status(400).json({ error: "Current password is incorrect" });
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);
        user.passwordHash = passwordHash;
        await user.save();

        res.json({ message: "Password updated successfully" });
    } catch (err) {
        console.error("❌ [PROFILE] updatePassword error:", err);
        res.status(500).json({ error: "Failed to update password" });
    }
};

// ============================================
// 🔹 Upload Avatar
// ============================================
exports.uploadAvatar = async (req, res) => {
    try {
        const userId = resolveUserId(req.user.id);
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        const uploadsRoot = path.join(__dirname, "../uploads");
        let relativePath = path.relative(uploadsRoot, req.file.path).replace(/\\/g, "/");
        if (relativePath.startsWith("..")) {
            relativePath = req.file.filename;
        }
        const avatarUrl = `/uploads/${relativePath}`;

        await user.update({ avatarUrl });

        res.json({ message: "Avatar updated successfully", avatarUrl });
    } catch (err) {
        console.error("❌ [PROFILE] uploadAvatar error:", err);
        res.status(500).json({ error: "Failed to upload avatar" });
    }
};

// ============================================
// 🔹 Admin: Upload Avatar for any user
// ============================================
exports.uploadAvatarAdmin = async (req, res) => {
    try {
        const targetId = req.params.id;
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const user = await User.findByPk(targetId);
        if (!user) return res.status(404).json({ error: "User not found" });

        const uploadsRoot = path.join(__dirname, "../uploads");
        let relativePath = path.relative(uploadsRoot, req.file.path).replace(/\\/g, "/");
        if (relativePath.startsWith("..")) {
            relativePath = req.file.filename;
        }
        const avatarUrl = `/uploads/${relativePath}`;

        await user.update({ avatarUrl });

        res.json({ message: "Avatar updated successfully", avatarUrl });
    } catch (err) {
        console.error("❌ [PROFILE ADMIN] uploadAvatar error:", err);
        res.status(500).json({ error: "Failed to upload avatar" });
    }
};

// ============================================
// 🔹 Admin: List Users
// ============================================
exports.listUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = "", role } = req.query;

        const offset = (page - 1) * limit;
        const where = {};

        if (role) {
            where.role = role;
        }

        if (search.trim()) {
            where[Op.or] = [
                { username: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { role: { [Op.like]: `%${search}%` } },
            ];
        }

        const { rows, count } = await User.findAndCountAll({
            where,
            attributes: { exclude: ["passwordHash"] },
            include: [
                {
                    association: "candidateProfile",
                    attributes: { exclude: ["createdAt", "updatedAt"] },
                    required: false,
                },
                {
                    association: "Company",
                    attributes: ["id", "name", "slug", "industry", "locationId", "market"],
                },
            ],
            order: [["createdAt", "DESC"]],
            offset,
            limit: parseInt(limit),
        });

        res.json({
            users: rows,
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit),
        });
    } catch (err) {
        console.error("❌ [ADMIN] listUsers error:", err);
        res.status(500).json({ error: "Failed to fetch users" });
    }
};


// ============================================
// 🔹 Admin: Update User
// ============================================
exports.updateUser = async (req, res) => {
    try {
        console.log("✏️ [ADMIN] Updating user ID:", req.params.id);
        const user = await User.findByPk(req.params.id);
        if (!user) {
            console.warn("⚠️ [ADMIN] User not found:", req.params.id);
            return res.status(404).json({ error: "User not found" });
        }

        const {
            username,
            email,
            role,
            status,
            headline,
            location,
            phone,
            firstName,
            lastName,
            companyId,
            avatarUrl,
            linkedinUrl,
            portfolioUrl,
            about,
            // candidate profile extras
            experienceYears,
            skills,
            languages,
            preferredJobType,
            isAvailable,
            expectedSalaryMin,
            expectedSalaryMax,
            currency,
            dateOfBirth,
            gender,
            nationality,
            workHistory,
            educationHistory,
            certifications,
        } = req.body;

        await user.update({
            username: username ?? user.username,
            email: email ?? user.email,
            role: role ?? user.role,
            status: status ?? user.status,
            headline: headline ?? user.headline,
            location: location ?? user.location,
            phone: phone ?? user.phone,
            firstName: firstName ?? user.firstName,
            lastName: lastName ?? user.lastName,
            company_id:
                companyId === ""
                    ? null
                    : companyId !== undefined
                    ? companyId
                    : user.company_id,
            avatarUrl: avatarUrl ?? user.avatarUrl,
            linkedinUrl: linkedinUrl ?? user.linkedinUrl,
            portfolioUrl: portfolioUrl ?? user.portfolioUrl,
            about: about ?? user.about,
        });

        // If candidate, also sync minimal profile fields
        if ((role || user.role) === "candidate") {
            const { CandidateProfile } = require("../models");
            const [profile] = await CandidateProfile.findOrCreate({
                where: { userId: user.id },
                defaults: {
                    userId: user.id,
                    firstName: firstName || user.firstName || user.username || "Candidate",
                    lastName: lastName || user.lastName || "Profile",
                },
            });
            const toJson = (val, fallback) => {
                if (val === undefined || val === null || val === "") return fallback;
                if (typeof val === "string") {
                    try {
                        return JSON.parse(val);
                    } catch (_) {
                        return fallback;
                    }
                }
                return val;
            };
            await profile.update({
                headline: headline ?? profile.headline,
                location: location ?? profile.location,
                phone: phone ?? profile.phone,
                firstName:
                    firstName ??
                    profile.firstName ??
                    user.firstName ??
                    user.username ??
                    "Candidate",
                lastName: lastName ?? profile.lastName ?? user.lastName ?? "Profile",
                email: email ?? profile.email ?? user.email,
                experienceYears:
                    experienceYears !== undefined && experienceYears !== null
                        ? Number(experienceYears)
                        : profile.experienceYears,
                skills: skills !== undefined
                    ? Array.isArray(skills)
                        ? skills
                        : typeof skills === "string"
                        ? skills.split(",").map((s) => s.trim()).filter(Boolean)
                        : profile.skills
                    : profile.skills,
                languages: languages !== undefined
                    ? Array.isArray(languages)
                        ? languages
                        : typeof languages === "string"
                        ? languages.split(",").map((s) => s.trim()).filter(Boolean)
                        : profile.languages
                    : profile.languages,
                preferredJobType: preferredJobType ?? profile.preferredJobType,
                isAvailable:
                    typeof isAvailable === "boolean" ? isAvailable : profile.isAvailable,
                expectedSalaryMin:
                    expectedSalaryMin !== undefined && expectedSalaryMin !== null
                        ? Number(expectedSalaryMin)
                        : profile.expectedSalaryMin,
                expectedSalaryMax:
                    expectedSalaryMax !== undefined && expectedSalaryMax !== null
                        ? Number(expectedSalaryMax)
                        : profile.expectedSalaryMax,
                currency: currency || profile.currency || "USD",
                dateOfBirth: dateOfBirth || profile.dateOfBirth || null,
                gender: gender || profile.gender || null,
                nationality: nationality || profile.nationality || null,
                workHistory: toJson(workHistory, profile.workHistory),
                educationHistory: toJson(educationHistory, profile.educationHistory),
                certifications: toJson(certifications, profile.certifications),
            });
        }
        console.log("✅ [ADMIN] User updated successfully:", user.id);
        res.json(user);
    } catch (err) {
        console.error("❌ [ADMIN] updateUser error:", err);
        res.status(500).json({ error: "Failed to update user" });
    }
};

// ============================================
// 🔹 Admin: Delete User
// ============================================
exports.deleteUser = async (req, res) => {
    try {
        console.log("🗑 [ADMIN] Deleting user ID:", req.params.id);
        const user = await User.findByPk(req.params.id);
        if (!user) {
            console.warn("⚠️ [ADMIN] User not found for deletion:", req.params.id);
            return res.status(404).json({ error: "User not found" });
        }

        await user.destroy();
        console.log("✅ [ADMIN] User deleted:", req.params.id);
        res.json({ message: "User deleted successfully" });
    } catch (err) {
        console.error("❌ [ADMIN] deleteUser error:", err);
        res.status(500).json({ error: "Failed to delete user" });
    }
};
