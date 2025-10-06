const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, "../../uploads/companies");

        // ✅ Ensure directory exists
        fs.mkdirSync(uploadPath, { recursive: true });

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(
            null,
            Date.now() + "-" + file.fieldname + path.extname(file.originalname)
        );
    },
});

const fileFilter = (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
        return cb(new Error("Only .jpeg, .png, .webp allowed"), false);
    }
    cb(null, true);
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
