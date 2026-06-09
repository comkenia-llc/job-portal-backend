"use strict";

module.exports = {
    async up(queryInterface) {
        const now = new Date();
        // Clear existing to avoid duplicate slug conflicts on re-run
        await queryInterface.bulkDelete("JobCategories", null, {});
        const categories = [
            "Engineering",
            "Product Management",
            "Design & UX",
            "Data & Analytics",
            "Marketing",
            "Sales & BD",
            "Customer Success & Support",
            "Finance & Accounting",
            "HR & People",
            "Legal & Compliance",
            "Operations & Supply Chain",
            "IT & Systems",
            "Security & DevSecOps",
            "Healthcare & Life Sciences",
            "Education & Training",
            "Construction & Real Estate",
            "Manufacturing",
            "Automotive & Aerospace",
            "Energy & Sustainability",
            "Media & Entertainment",
            "Gaming & 3D",
            "Hospitality & Travel",
            "Retail & E-commerce",
            "Logistics & Transportation",
            "Government & Public Sector",
        ];

        const toSlug = (value) =>
            (value || "")
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9\s-]/g, "")
                .replace(/\s+/g, "-")
                .replace(/-+/g, "-")
                .replace(/^-+|-+$/g, "");

        const parentRows = categories.map((name) => ({
            name,
            slug: toSlug(name),
            description: `${name} roles curated for Dubai Job Zone.`,
            isFeatured: false,
            parentId: null,
            createdAt: now,
            updatedAt: now,
        }));

        await queryInterface.bulkInsert("JobCategories", parentRows, {});

        // Map of parent slug -> id
        const [parents] = await queryInterface.sequelize.query(
            "SELECT id, slug FROM JobCategories WHERE parentId IS NULL"
        );
        const parentIdBySlug = Object.fromEntries(parents.map((p) => [p.slug, p.id]));

        const subcategories = [
            { parent: "engineering", name: "Backend Engineering" },
            { parent: "engineering", name: "Frontend Engineering" },
            { parent: "engineering", name: "Full-Stack Engineering" },
            { parent: "engineering", name: "Mobile Engineering" },
            { parent: "engineering", name: "QA & Automation" },
            { parent: "engineering", name: "DevOps / SRE" },

            { parent: "product-management", name: "Product Manager" },
            { parent: "product-management", name: "Product Owner" },
            { parent: "product-management", name: "Product Operations" },

            { parent: "design-ux", name: "UX Design" },
            { parent: "design-ux", name: "UI / Visual Design" },
            { parent: "design-ux", name: "Product Design" },
            { parent: "design-ux", name: "Motion / Interaction Design" },

            { parent: "data-analytics", name: "Data Science" },
            { parent: "data-analytics", name: "Data Engineering" },
            { parent: "data-analytics", name: "Analytics / BI" },
            { parent: "data-analytics", name: "Machine Learning" },

            { parent: "marketing", name: "Performance Marketing" },
            { parent: "marketing", name: "Content Marketing" },
            { parent: "marketing", name: "SEO / ASO" },
            { parent: "marketing", name: "Social & Community" },

            { parent: "sales-bd", name: "SDR / BDR" },
            { parent: "sales-bd", name: "Account Executive" },
            { parent: "sales-bd", name: "Partnerships / Alliances" },

            { parent: "customer-success-support", name: "Customer Success Manager" },
            { parent: "customer-success-support", name: "Technical Support" },
            { parent: "customer-success-support", name: "Implementation" },

            { parent: "hr-people", name: "Talent Acquisition" },
            { parent: "hr-people", name: "HR Business Partner" },
            { parent: "hr-people", name: "People Operations" },

            { parent: "finance-accounting", name: "Financial Planning (FP&A)" },
            { parent: "finance-accounting", name: "Accounting" },
            { parent: "finance-accounting", name: "Audit & Risk" },

            { parent: "it-systems", name: "SysAdmin / IT Support" },
            { parent: "it-systems", name: "Network Engineering" },
            { parent: "it-systems", name: "Cloud Infrastructure" },

            { parent: "security-devsecops", name: "AppSec / Product Security" },
            { parent: "security-devsecops", name: "Security Operations" },

            { parent: "healthcare-life-sciences", name: "Nursing" },
            { parent: "healthcare-life-sciences", name: "Physicians & Surgeons" },
            { parent: "healthcare-life-sciences", name: "Clinical Operations" },

            { parent: "media-entertainment", name: "Film & TV Production" },
            { parent: "media-entertainment", name: "Video Editing" },
            { parent: "media-entertainment", name: "Journalism & Writing" },

            { parent: "construction-real-estate", name: "Civil Engineering" },
            { parent: "construction-real-estate", name: "Site Management" },
            { parent: "construction-real-estate", name: "Project Engineering" },

            { parent: "retail-e-commerce", name: "Merchandising" },
            { parent: "retail-e-commerce", name: "Store Management" },
            { parent: "retail-e-commerce", name: "E-commerce Operations" },
        ];

        const subRows = subcategories
            .filter((s) => parentIdBySlug[s.parent])
            .map((s) => ({
                name: s.name,
                slug: toSlug(`${s.parent}-${s.name}`),
                description: `${s.name} roles under ${s.parent}`,
                isFeatured: false,
                parentId: parentIdBySlug[s.parent],
                createdAt: now,
                updatedAt: now,
            }));

        if (subRows.length) {
            await queryInterface.bulkInsert("JobCategories", subRows, {});
        }
    },

    async down(queryInterface) {
        await queryInterface.bulkDelete("JobCategories", null, {});
    },
};
