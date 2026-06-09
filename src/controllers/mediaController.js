const path = require("path");

const buildAbsoluteUrl = (req, relativePath) => {
    const proto = req.headers["x-forwarded-proto"] || req.protocol;
    const host = req.headers["x-forwarded-host"] || req.get("host");
    return `${proto}://${host}${relativePath}`;
};

exports.uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "Image file is required" });
        }

        const uploadsRoot = path.join(__dirname, "../uploads");
        let relativePath = path.relative(uploadsRoot, req.file.path).replace(/\\/g, "/");
        if (!relativePath.startsWith("/")) relativePath = `/${relativePath}`;

        const publicPath = `/uploads${relativePath}`;
        const absoluteUrl = buildAbsoluteUrl(req, publicPath);

        res.status(201).json({
            path: publicPath,
            url: absoluteUrl,
        });
    } catch (err) {
        console.error("❌ uploadImage error:", err);
        res.status(500).json({ error: "Failed to upload image" });
    }
};
