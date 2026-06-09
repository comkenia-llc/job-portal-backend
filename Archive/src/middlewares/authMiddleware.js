const jwt = require("jsonwebtoken");

/**
 * ✅ Main authentication middleware
 * Reads JWT from either:
 *  - HttpOnly cookie (preferred)
 *  - Authorization header (fallback for API clients)
 */
exports.authMiddleware = (req, res, next) => {
    try {
        // 🔍 Check both cookie & header
        const token =
            req.cookies?.token ||
            (req.headers.authorization &&
                req.headers.authorization.split(" ")[1]);

        if (!token) {
            console.warn("🔒 [AUTH] No token provided:", req.originalUrl);
            return res.status(401).json({ error: "No token provided" });
        }

        // 🔑 Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        console.log("✅ [AUTH] JWT verified. Raw payload:", decoded);

        // 🧹 Handle nested id object bug (id: { id: 3 })
        const userId =
            typeof decoded.id === "object" && decoded.id.id
                ? decoded.id.id
                : decoded.id;

        // ✅ Attach clean user info to request
        req.user = {
            id: userId,
            role: decoded.role,
            companyId: decoded.companyId || null, // 🧩 FIX HERE
            iat: decoded.iat,
            exp: decoded.exp,
        };

        console.log("🟢 [AUTH] Authenticated user:", req.user);
        next();
    } catch (err) {
        console.error("❌ [AUTH] Token verification failed:", err.message);
        return res.status(403).json({ error: "Invalid or expired token" });
    }
};

/**
 * 🟦 Optional auth — attaches req.user if token exists; otherwise continues
 */
exports.optionalAuth = (req, _res, next) => {
    try {
        const token =
            req.cookies?.token ||
            (req.headers.authorization &&
                req.headers.authorization.split(" ")[1]);

        if (!token) {
            req.user = null;
            return next(); // ✅ EXIT here
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const userId =
            typeof decoded.id === "object" && decoded.id.id
                ? decoded.id.id
                : decoded.id;

        req.user = {
            id: userId,
            role: decoded.role,
            companyId: decoded.companyId || null,
            iat: decoded.iat,
            exp: decoded.exp,
        };

        return next(); // ✅ explicit & safe
    } catch (err) {
        console.warn("⚠️ [AUTH optional] token ignored:", err.message);
        req.user = null;
        return next(); // ✅ single exit
    }
};

/**
 * ✅ Admin-only middleware
 */
exports.adminMiddleware = (req, res, next) => {
    console.log("🧩 [AUTH] Checking admin access for:", req.user);
    if (!req.user || req.user.role !== "admin") {
        console.warn("🚫 [AUTH] Access denied — Admin only");
        return res.status(403).json({ error: "Admin access required" });
    }
    next();
};

/**
 * ✅ Employer OR Admin access
 */
exports.employerOrAdminMiddleware = (req, res, next) => {
    console.log("🧩 [AUTH] Checking employer/admin access:", req.user);
    if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
    }
    if (req.user.role !== "employer" && req.user.role !== "admin") {
        console.warn(
            `🚫 [AUTH] Role not allowed: ${req.user.role} (User ID: ${req.user.id})`
        );
        return res
            .status(403)
            .json({ error: "Employer or Admin access required" });
    }
    next();
};

/**
 * ✅ Explicit isAdmin middleware
 * Use this where only admins should access.
 */
exports.isAdmin = (req, res, next) => {
    console.log("🧩 [AUTH] Checking isAdmin for:", req.user);
    if (!req.user || req.user.role !== "admin") {
        console.warn(
            `🚫 [AUTH] Access denied: ${req.user?.role || "unknown"} (User ID: ${req.user?.id || "N/A"
            })`
        );
        return res.status(403).json({ error: "Access denied: Admins only" });
    }
    next();
};
