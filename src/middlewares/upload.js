const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ✅ Smart Multer configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Base upload folder — defaults to "misc" if not set
        const baseFolder = req.uploadFolder || "misc";

        // 🧠 Auto-detect subfolders for specific types (e.g., logo/banner for companies)
        let subFolder = "";
        
        if (baseFolder === "companies") {
            if (file.fieldname === "logo") subFolder = "logo";
            else if (file.fieldname === "banner") subFolder = "banner";
            else if (file.fieldname === "metaImage") subFolder = "meta";
        }

        // 🧩 Full path inside src/uploads
        const uploadPath = path.join(__dirname, `../uploads/${baseFolder}/${subFolder}`);

        // Ensure folder exists recursively
        fs.mkdirSync(uploadPath, { recursive: true });

        cb(null, uploadPath);
    },

    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const safeField = file.fieldname.replace(/[^a-z0-9_-]/gi, "_"); // sanitize
        cb(null, `${timestamp}-${safeField}${ext}`);
    },
});

// ✅ Restrict allowed image formats
const fileFilter = (req, file, cb) => {
    const allowed = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/svg+xml",
        "image/x-icon",
    ];
    if (!allowed.includes(file.mimetype)) {
        return cb(new Error("Only .jpeg, .png, .webp, .svg, .ico files allowed"), false);
    }
    cb(null, true);
};

// ✅ Initialize multer
const upload = multer({ storage, fileFilter });

module.exports = upload;
