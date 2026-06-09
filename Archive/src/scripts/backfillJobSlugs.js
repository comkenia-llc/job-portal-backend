"use strict";

require("dotenv").config();

const { Op } = require("sequelize");
const { Job, Company } = require("../models");

const slugifyValue = (value) =>
  (value || "")
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);

const buildSlugSeed = ({ title, companyName, location, fallback }) =>
  [title, companyName, location].filter(Boolean).join(" ") || fallback;

const ensureUniqueSlug = (baseSlug, usedSlugs, fallback) => {
  let base = slugifyValue(baseSlug) || slugifyValue(fallback) || fallback;
  if (!base) {
    base = `job-${Date.now()}`;
  }

  let slug = base;
  let counter = 1;

  while (usedSlugs.has(slug)) {
    slug = `${base}-${counter++}`;
  }

  usedSlugs.add(slug);
  return slug;
};

async function backfillSlugs() {
  console.log("🔄 Backfilling job slugs...");

  const existingSlugs = new Set(
    (
      await Job.findAll({
        attributes: ["slug"],
        where: { slug: { [Op.ne]: null } },
      })
    )
      .map((job) => job.slug)
      .filter(Boolean)
  );

  const jobsNeedingSlugs = await Job.findAll({
    where: {
      [Op.or]: [{ slug: null }, { slug: "" }],
    },
    include: [
      {
        model: Company,
        as: "company",
        attributes: ["name"],
      },
    ],
  });

  if (!jobsNeedingSlugs.length) {
    console.log("✅ All jobs already have slugs. Nothing to do!");
    return;
  }

  for (const job of jobsNeedingSlugs) {
    const seed = buildSlugSeed({
      title: job.title,
      companyName: job.company?.name,
      location: job.location,
      fallback: `job-${job.id}`,
    });
    const slug = ensureUniqueSlug(seed, existingSlugs, `job-${job.id}`);
    job.slug = slug;
    await job.save();
    console.log(`• Job ${job.id} (${job.title}) → ${slug}`);
  }

  console.log(`✅ Finished backfilling ${jobsNeedingSlugs.length} job slugs.`);
}

backfillSlugs()
  .catch((err) => {
    console.error("❌ Failed to backfill slugs:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (Job?.sequelize) {
      await Job.sequelize.close();
    }
  });
