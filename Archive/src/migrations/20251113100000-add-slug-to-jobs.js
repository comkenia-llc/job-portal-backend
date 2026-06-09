"use strict";

const slugify = (value) => {
  return (value || "")
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90) || `job-${Date.now()}`;
};

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const tableDefinition = await queryInterface.describeTable("Jobs");
      const hasSlugColumn = Boolean(tableDefinition.slug);

      if (!hasSlugColumn) {
        await queryInterface.addColumn(
          "Jobs",
          "slug",
          {
            type: Sequelize.STRING,
            allowNull: true,
          },
          { transaction }
        );
      }

      const used = new Set();
      const [existingSlugs] = await queryInterface.sequelize.query(
        "SELECT slug FROM Jobs WHERE slug IS NOT NULL AND slug <> ''",
        { transaction }
      );
      existingSlugs.forEach(({ slug }) => used.add(slug));

      const [jobsNeedingSlugs] = await queryInterface.sequelize.query(
        "SELECT id, title FROM Jobs WHERE slug IS NULL OR slug = '' ORDER BY id ASC",
        { transaction }
      );

      for (const job of jobsNeedingSlugs) {
        const base = slugify(job.title);
        let slug = base;
        let counter = 1;

        while (used.has(slug)) {
          slug = `${base}-${counter++}`;
        }

        used.add(slug);

        await queryInterface.sequelize.query(
          "UPDATE Jobs SET slug = :slug WHERE id = :id",
          {
            transaction,
            replacements: { slug, id: job.id },
          }
        );
      }

      await queryInterface.changeColumn(
        "Jobs",
        "slug",
        {
          type: Sequelize.STRING,
          allowNull: false,
        },
        { transaction }
      );

      try {
        await queryInterface.addConstraint(
          "Jobs",
          {
            type: "unique",
            fields: ["slug"],
            name: "jobs_slug_unique",
          },
          { transaction }
        );
      } catch (err) {
        if (!/Duplicate|already exists/i.test(err.message)) {
          throw err;
        }
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeConstraint(
        "Jobs",
        "jobs_slug_unique",
        { transaction }
      );
      await queryInterface.removeColumn("Jobs", "slug", { transaction });
    });
  },
};
