require("dotenv").config();

module.exports = {
    API_URL: process.env.API_URL,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    INTERNAL_API_KEY: process.env.INTERNAL_API_KEY,
    UNSPLASH_KEY: process.env.UNSPLASH_KEY,
    PIXABAY_KEY: process.env.PIXABAY_KEY,  // ✅ make sure this line exists
    GEODB_KEY: process.env.GEODB_KEY,
    DEFAULT_FLAG: process.env.DEFAULT_FLAG,
    DEFAULT_IMAGE: process.env.DEFAULT_IMAGE,
    LOG_LEVEL: process.env.LOG_LEVEL || "info",
};
