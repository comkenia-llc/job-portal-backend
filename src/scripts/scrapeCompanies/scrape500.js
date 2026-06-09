const { scrapeCategories } = require("./scrapeCategories");
const { scrapeCategoryCompanies } = require("./scrapeCategoryCompanies");

async function collect500() {
    const categories = await scrapeCategories();
    const final = new Set();

    for (let cat of categories) {
        console.log("\n🟦 Category:", cat.url);

        const links = await scrapeCategoryCompanies(cat.url);
        links.forEach(l => final.add(l));

        console.log("Collected:", final.size);

        if (final.size >= 500) break;
    }

    console.log("\n🎉 FINAL:", final.size);
    console.log(Array.from(final).slice(0, 20));
}

collect500();
