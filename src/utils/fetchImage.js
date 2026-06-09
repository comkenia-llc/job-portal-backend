/**
 * fetchImage.js — Final Optimized
 * ✅ Avoids duplicate images
 * ✅ Prefers Pixabay fallback
 * ✅ Adds Wikimedia User-Agent
 * ✅ Logs everything cleanly
 */

const axios = require("axios");
const fs = require("fs");
const path = require("path");
const downloadImage = require("./downloadImage");
const config = require("../../src/utils/scrapperConfig");

const UNSPLASH_KEY = config.UNSPLASH_KEY;
const PIXABAY_KEY = config.PIXABAY_KEY;
const IMAGES_DIR = path.join(process.cwd(), "uploads/locations/images");

const DEFAULT_IMAGE = config.DEFAULT_IMAGE || "/uploads/locations/default.jpg";
fs.mkdirSync(IMAGES_DIR, { recursive: true });

// 🧠 local memory to avoid duplicate URLs
const usedUrls = new Set();

// 🧩 Utility helpers
function safeFilename(slug) {
    return slug.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "");
}
function absPathFor(slug) {
    return path.join(IMAGES_DIR, `${safeFilename(slug)}.jpg`);
}
function cachedPathFor(slug) {
    return `/uploads/locations/images/${safeFilename(slug)}.jpg`;
}
function cleanQuery(q) {
    return q
        .replace(/[,]/g, " ")
        .replace(/\b(Province|Region|State|City|District|Governorate|Oblast|Prefecture)\b/gi, "")
        .replace(/\s{2,}/g, " ")
        .trim();
}
function preview(obj) {
    try {
        return JSON.stringify(obj, null, 2).slice(0, 600) + "…";
    } catch {
        return "(unserializable)";
    }
}

function isPreferredImageUrl(url) {
    if (!url) return false;
    const lower = url.toLowerCase();
    if (lower.endsWith(".svg")) return false;
    if (lower.includes(".svg?")) return false;
    return true;
}

/* -------------------------
   Image Providers
   ------------------------- */

// 1️⃣ Unsplash
async function tryUnsplash(query) {
    if (!UNSPLASH_KEY) {
        console.log("❌ No UNSPLASH_KEY found in .env");
        return null;
    }
    try {
        const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
            query
        )}&orientation=landscape&per_page=3&client_id=${UNSPLASH_KEY}`;
        console.log("🔍 [Unsplash] GET", url);
        const { data } = await axios.get(url, { timeout: 15000 });
        const results = data.results || [];
        for (const r of results) {
            const img = r.urls?.regular;
            if (img && !usedUrls.has(img)) {
                console.log(`🌄 Unsplash HIT: ${img}`);
                usedUrls.add(img);
                return img;
            }
        }
        console.log("🚫 Unsplash returned 0 new results");
        return null;
    } catch (err) {
        console.log("❌ [Unsplash] error:", err.message);
        if (err.response)
            console.log("↳", err.response.status, preview(err.response.data));
        return null;
    }
}

// 2️⃣ Pixabay
async function tryPixabay(query) {
    if (!PIXABAY_KEY) {
        console.log("❌ No PIXABAY_KEY found in .env");
        return null;
    }
    try {
        const clean = cleanQuery(query);
        const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(
            clean
        )}&orientation=horizontal&image_type=photo&per_page=5&safesearch=true`;
        console.log("🔍 [Pixabay] GET", url);
        const { data } = await axios.get(url, { timeout: 15000 });
        console.log("🧾 [Pixabay] Response preview:", preview(data));

        const hits = data.hits || [];
        for (const h of hits) {
            const img =
                h.largeImageURL || h.webformatURL || h.previewURL || null;
            if (img && !usedUrls.has(img)) {
                console.log(`🌆 Pixabay HIT → ${img}`);
                usedUrls.add(img);
                return img;
            }
        }

        console.log("🚫 Pixabay returned duplicate or empty results — retrying...");
        // fallback: broader query
        const fallback = clean.split(" ").pop() + " landscape";
        const retryUrl = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(
            fallback
        )}&orientation=horizontal&image_type=photo&per_page=5&safesearch=true`;
        console.log("🔁 [Pixabay retry] GET", retryUrl);
        const retry = await axios.get(retryUrl, { timeout: 15000 });
        console.log("🧾 [Pixabay retry] preview:", preview(retry.data));

        for (const h of retry.data.hits || []) {
            const img =
                h.largeImageURL || h.webformatURL || h.previewURL || null;
            if (img && !usedUrls.has(img)) {
                console.log(`🌆 Pixabay Fallback HIT → ${img}`);
                usedUrls.add(img);
                return img;
            }
        }

        return null;
    } catch (err) {
        console.log("❌ [Pixabay] error:", err.message);
        if (err.response)
            console.log("↳", err.response.status, preview(err.response.data));
        return null;
    }
}

// 3️⃣ Wikimedia
async function tryWikimedia(query) {
    try {
        const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&piprop=original&generator=search&gsrsearch=${encodeURIComponent(
            query
        )}&gsrlimit=3`;
        console.log("🔍 [Wikimedia] GET", url);
        const { data } = await axios.get(url, {
            timeout: 15000,
            headers: { "User-Agent": "KeekanBot/1.0 (contact@keekan.com)" },
        });
        console.log("🧾 [Wikimedia] Response preview:", preview(data));
        const pages = data?.query?.pages;
        if (!pages) return null;

        for (const key of Object.keys(pages)) {
            const img = pages[key]?.original?.source;
            if (img && !isPreferredImageUrl(img)) {
                console.log(`⚠️ Wikimedia returned SVG asset, skipping → ${img}`);
                continue;
            }
            if (img && !usedUrls.has(img)) {
                console.log(`📸 Wikimedia HIT: ${img}`);
                usedUrls.add(img);
                return img;
            }
        }

        console.log("🚫 Wikimedia returned 0 new results");
        return null;
    } catch (err) {
        console.log("❌ [Wikimedia] error:", err.message);
        return null;
    }
}

/* -------------------------
   Main Export
   ------------------------- */

module.exports = async function fetchImage(query, slug = null) {
    const cleaned = cleanQuery(query);
    const slugSafe = slug || safeFilename(cleaned);
    const outPath = absPathFor(slugSafe);
    const publicPath = cachedPathFor(slugSafe);

    console.log(`\n🖼️ [fetchImage] Searching for "${cleaned}"`);

    // ✅ Use cached if already downloaded
    if (fs.existsSync(outPath) && fs.statSync(outPath).size > 0) {
        console.log("💾 Cached →", publicPath);
        return publicPath;
    }

    const providers = [tryUnsplash, tryPixabay, tryWikimedia];

    for (const provider of providers) {
        const url = await provider(cleaned);
        if (url) {
            console.log(`✅ ${provider.name} provided new image → ${url}`);
            const saved = await downloadImage(url, "locations/images", `${slugSafe}.jpg`);
            if (saved) return saved;
        } else {
            console.log(`⚠️ ${provider.name} returned null`);
        }
    }

    console.log(`⚠️ No provider found any new image for "${cleaned}" — using default`);
    return DEFAULT_IMAGE;
};
