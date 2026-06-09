/**
 * downloadImage.js — Final Version
 * ✅ Actually downloads and saves image to correct local path
 * ✅ Creates directories recursively
 * ✅ Returns the correct public path for upload
 */

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const logger = require("./logger");

const DEFAULT_HEADERS = {
    "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
    Accept:
        "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    Referer: "https://en.wikipedia.org/",
};

const buildHeadersForUrl = (url) => {
    const headers = { ...DEFAULT_HEADERS };

    if (url.includes("upload.wikimedia.org")) {
        headers.Referer = "https://commons.wikimedia.org/";
    } else if (url.includes("images.unsplash.com")) {
        headers.Referer = "https://unsplash.com/";
    } else if (url.includes("pixabay.com")) {
        headers.Referer = "https://pixabay.com/";
    }

    return headers;
};

module.exports = async function downloadImage(url, subDir = "locations/images", filename) {
    try {
        // ✅ Ensure destination directory exists
        const baseDir = path.join(process.cwd(), "uploads", subDir);
        fs.mkdirSync(baseDir, { recursive: true });

        const filePath = path.join(baseDir, filename);
        const publicPath = `/uploads/${subDir}/${filename}`;

        // ✅ Skip if already exists
        if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
            logger.info(`💾 Cached image exists → ${publicPath}`);
            return publicPath;
        }

        // ✅ Download and save stream
        logger.info(`⬇️ Downloading image → ${url}`);
        const response = await axios.get(url, {
            responseType: "stream",
            timeout: 30000,
            maxRedirects: 5,
            headers: buildHeadersForUrl(url),
        });
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
        });

        logger.success(`✅ Saved image → ${publicPath}`);
        return publicPath;
    } catch (err) {
        if (err.response?.status) {
            logger.error(`❌ downloadImage failed: ${err.response.status} ${err.message}`);
        } else {
            logger.error(`❌ downloadImage failed: ${err.message}`);
        }
        return null;
    }
};
