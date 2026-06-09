const axios = require("axios");
const cheerio = require("cheerio");

async function scrapeCategories() {
    const url = "https://dcciinfo.com/uae/all/categories";
    console.log("Scraping categories...");

    const res = await axios.get(url, {
        headers: { "User-Agent": "Mozilla/5.0" }
    });

    const $ = cheerio.load(res.data);

    const categories = [];

    $("div.col-12.col-md-6.col-xl-4 a").each((i, el) => {
        const href = $(el).attr("href");
        const name = $(el).text().trim();

        if (!href) return;

        let finalUrl = href.startsWith("http")
            ? href
            : `https://dcciinfo.com${href}`;

        categories.push({
            name,
            url: finalUrl
        });
    });

    console.log("Total categories:", categories.length);
    return categories;
}

module.exports = { scrapeCategories };
