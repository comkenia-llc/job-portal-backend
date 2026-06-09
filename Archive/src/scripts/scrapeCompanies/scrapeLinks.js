const axios = require("axios");
const cheerio = require("cheerio");

async function scrapeCompanyLinksFromCategory(categoryUrl) {
    const allLinks = new Set();

    for (let page = 1; page <= 20; page++) {
        const url = `${categoryUrl}?page=${page}`;
        console.log("Scraping:", url);

        try {
            const res = await axios.get(url, {
                headers: { "User-Agent": "Mozilla/5.0" }
            });

            const $ = cheerio.load(res.data);

            const cards = $(".company-listing a");

            if (cards.length === 0) break;

            cards.each((i, el) => {
                const href = $(el).attr("href");
                if (href && href.includes("/")) {
                    allLinks.add("https://dcciinfo.ae" + href);
                }
            });

            if (allLinks.size >= 500) break;

        } catch (e) {
            break;
        }
    }

    return Array.from(allLinks);
}

module.exports = { scrapeCompanyLinksFromCategory };
