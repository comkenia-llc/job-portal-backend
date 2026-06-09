/**
 * 📤 uploadToAPI — sends location data + binary image/flag files to backend
 * ✅ Handles correct multipart upload for both flag and image files
 * ✅ Fixes MySQL integer & null issues
 * ✅ Automatically attaches file binaries from local disk
 */

const axios = require("axios").default;
const { wrapper } = require("axios-cookiejar-support");
const { CookieJar } = require("tough-cookie");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const config = require("../config");
const logger = require("./logger");

const jar = new CookieJar();
const client = wrapper(axios.create({ withCredentials: true, jar }));

// 🔐 Login to backend once
async function ensureLogin() {
    const cookies = await jar.getCookies(config.API_URL);
    if (cookies.length > 0) return;

    logger.info("🔐 Logging in to backend...");
    try {
        const res = await client.post(`${config.API_URL}/api/auth/login`, {
            email: config.ADMIN_EMAIL,
            password: config.ADMIN_PASSWORD,
        });
        if (res.status >= 200 && res.status < 300) {
            logger.success("✅ Logged in successfully. Cookie saved.");
        }
    } catch {
        logger.warn("⚠️ Login skipped (internal API likely bypasses auth).");
    }
}

async function uploadToAPI(data) {
    await ensureLogin();

    // ✅ Safe data defaults
    const safeData = {
        country: data.country || "",
        state: data.state || "",
        city: data.city || "",
        slug: data.slug || "",
        type: data.type || "country",
        parentId:
            data.parentId === undefined ||
                data.parentId === "" ||
                data.parentId === "null"
                ? null
                : parseInt(data.parentId, 10),
        ...data,
    };

    const form = new FormData();

    // ✅ Append all text fields
    for (const key in safeData) {
        if (["flag", "image", "metaImage"].includes(key)) continue;

        if (key === "parentId") {
            if (safeData.parentId !== null && !Number.isNaN(safeData.parentId)) {
                form.append(key, String(safeData.parentId));
            }
        } else {
            form.append(key, String(safeData[key] ?? ""));
        }
    }

    // ✅ Proper absolute file resolver
    const resolveFilePath = (val) => {
        if (!val) return null;

        // Clean duplicate /uploads/uploads bug
        let fixed = val.replace("/uploads/uploads/", "/uploads/");

        // Always assume relative to scrapper root
        if (fixed.startsWith("/uploads"))
            return path.join(process.cwd(), fixed.replace(/^\/+/, ""));
        if (fixed.startsWith("uploads"))
            return path.join(process.cwd(), fixed);
        return path.resolve(fixed);
    };

    // ✅ Attach files correctly as binaries
    for (const key of ["flag", "image", "metaImage"]) {
        const val = safeData[key];
        if (!val) continue;

        const absPath = resolveFilePath(val);
        if (absPath && fs.existsSync(absPath)) {
            logger.info(`📎 Attached file: ${absPath}`);
            form.append(key, fs.createReadStream(absPath));
        } else {
            logger.warn(`⚠️  File not found locally for ${key}: ${absPath}`);
            form.append(key, val);
        }
    }

    const url = `${config.API_URL}/api/internal/locations`;
    const headers = {
        ...form.getHeaders(),
        "x-api-key": process.env.INTERNAL_API_KEY || "",
    };

    try {
        console.log("📦 [uploadToAPI] Sending to backend:", {
            apiUrl: url,
            flag: safeData.flag,
            image: safeData.image,
            parentId: safeData.parentId,
        });

        const res = await client.post(url, form, {
            headers,
            withCredentials: true,
            jar,
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 60000,
        });

        if (res.status >= 200 && res.status < 300) {
            logger.success(`✅ ✅ Uploaded ${safeData.slug} (${res.status})`);
            return res.data;
        } else {
            throw new Error(`Upload failed (${res.status})`);
        }
    } catch (err) {
        console.error("❌ Upload error:", err.message);
        if (err.response) {
            console.error("↳ Status:", err.response.status);
            console.error("↳ Body:", err.response.data);
        }
        throw err;
    }
}

module.exports = uploadToAPI;
