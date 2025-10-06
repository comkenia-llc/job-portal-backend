const jwt = require("jsonwebtoken");

exports.authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token provided" });

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: "Invalid token" });
    }
};

// ✅ Admin only
exports.adminMiddleware = (req, res, next) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
    }
    next();
};

// ✅ Employer OR Admin
exports.employerOrAdminMiddleware = (req, res, next) => {
    if (req.user.role !== "employer" && req.user.role !== "admin") {
        return res.status(403).json({ error: "Employer or Admin access required" });
    }
    next();
};

exports.isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ error: "Access denied: Admins only" });
    }
    next();
};
