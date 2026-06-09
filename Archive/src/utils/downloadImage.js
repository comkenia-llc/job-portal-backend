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
        const response = await axios.get(url, { responseType: "stream", timeout: 30000 });
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
        });

        logger.success(`✅ Saved image → ${publicPath}`);
        return publicPath;
    } catch (err) {
        logger.error(`❌ downloadImage failed: ${err.message}`);
        return null;
    }
};
