const axios = require("axios");
const cheerio = require("cheerio");

async function scrapeCategoryCompanies(categoryUrl) {
    const companies = new Set();

    for (let offset = 0; offset <= 2000; offset += 50) {
        const url = `${categoryUrl}/${offset}`;
        console.log("Scraping:", url);

        const res = await axios.get(url, {
            headers: { "User-Agent": "Mozilla/5.0" }
        });

        const $ = cheerio.load(res.data);

        const items = $("a[href*='/company/']");
        if (items.length === 0) {
            console.log("No more companies. Stopping.");
            break;
        }

        items.each((i, el) => {
            let href = $(el).attr("href");
            if (!href) return;

            let finalUrl = href.startsWith("http")
                ? href
                : `https://dcciinfo.com${href}`;

            companies.add(finalUrl);
        });

        if (companies.size >= 500) break;
    }

    return Array.from(companies);
}

module.exports = { scrapeCategoryCompanies };
