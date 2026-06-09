"use strict";

const slugify = (name) =>
    name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

module.exports = {
    async up(queryInterface) {
        // Clean existing to avoid unique conflicts on rerun
        await queryInterface.bulkDelete("Skills", null, {});
        await queryInterface.bulkDelete("SkillCategories", null, {});

        const now = new Date();

        const categories = [
            "Programming Languages",
            "Backend Frameworks",
            "Frontend Frameworks",
            "Data & Analytics",
            "Machine Learning & AI",
            "Cloud & DevOps",
            "Mobile Development",
            "Security & QA",
            "Product & Design",
            "Sales & Marketing",
            "Content & SEO",
            "Customer Success",
            "Finance & Operations",
            "Entertainment & Media",
            "Soft Skills",
            "Healthcare & Life Sciences",
            "Legal & Compliance",
            "Education & Training",
            "Human Resources & Talent",
            "Manufacturing & Supply Chain",
            "Construction & Facilities",
            "Energy & Utilities",
            "Embedded & IoT",
            "Gaming & 3D",
            "Blockchain & Web3",
            "Networking & ITSM",
            "ERP & CRM",
            "QA & Testing",
            "Hospitality & Retail",
            "Automotive & Aerospace",
            "Insurance & Real Estate",
        ];

        const categoryRows = categories.map((name) => ({
            name,
            slug: slugify(name),
            description: `${name} related skills`,
            createdAt: now,
            updatedAt: now,
        }));

        await queryInterface.bulkInsert("SkillCategories", categoryRows);
        const [inserted] = await queryInterface.sequelize.query(
            "SELECT id, name FROM SkillCategories WHERE slug IN (:slugs)",
            {
                replacements: { slugs: categoryRows.map((c) => c.slug) },
            }
        );
        const categoryIdByName = new Map(inserted.map((c) => [c.name, c.id]));

        const skillsByCategory = {
            "Programming Languages": ["JavaScript", "TypeScript", "Python", "Java", "C#", "PHP", "Ruby", "Go", "SQL"],
            "Backend Frameworks": ["Node.js", "Express", "NestJS", "Django", "Flask", "Laravel", "Spring Boot", ".NET Core", "Rails", "FastAPI", "AdonisJS"],
            "Frontend Frameworks": ["React", "Next.js", "Vue.js", "Nuxt.js", "Angular", "Svelte", "Tailwind CSS", "Bootstrap", "Redux", "Webpack", "Vite"],
            "Data & Analytics": ["MySQL", "PostgreSQL", "MongoDB", "Redis", "Elasticsearch", "BigQuery", "Airflow", "Power BI", "Tableau", "Looker", "dbt", "Snowflake"],
            "Machine Learning & AI": ["PyTorch", "TensorFlow", "scikit-learn", "pandas", "NumPy", "LLMs", "LangChain", "Prompt Engineering"],
            "Cloud & DevOps": ["AWS", "Azure", "GCP", "Docker", "Kubernetes", "CI/CD", "Terraform", "Ansible", "Jenkins", "GitLab CI", "Helm", "Pulumi"],
            "Mobile Development": ["React Native", "Flutter", "Swift", "Kotlin", "Android", "iOS", "Mobile CI/CD"],
            "Security & QA": ["Penetration Testing", "OWASP", "AppSec", "SAST", "DAST", "Selenium", "Cypress", "Playwright", "Jest", "Mocha", "Chai"],
            "Product & Design": ["Figma", "Sketch", "Product Management", "Wireframing", "Prototyping", "User Research", "Design Systems", "A/B Testing", "Roadmapping"],
            "Sales & Marketing": ["CRM", "Salesforce", "HubSpot", "Email Marketing", "SEO", "SEM", "Google Analytics", "Copywriting", "Paid Ads", "Performance Marketing"],
            "Content & SEO": ["Content Strategy", "Technical SEO", "On-page SEO", "Off-page SEO", "Content Writing", "Localization"],
            "Customer Success": ["Account Management", "Customer Support", "Onboarding", "Troubleshooting", "Communication", "Renewals", "Upsell"],
            "Finance & Operations": ["Excel", "Budgeting", "Forecasting", "Process Improvement", "Project Management", "Risk Management", "Procurement"],
            "Entertainment & Media": [
                "Film Editing",
                "Video Production",
                "Cinematography",
                "Motion Graphics",
                "Sound Design",
                "Music Production",
                "Audio Mixing",
                "Voiceover",
                "Podcasting",
                "Screenwriting",
                "Storyboarding",
                "Color Grading",
                "Animation",
                "Adobe Premiere Pro",
                "Final Cut Pro",
                "DaVinci Resolve",
                "After Effects",
                "Photography",
                "Content Creation",
                "Livestreaming",
            ],
            "Soft Skills": ["Leadership", "Communication", "Collaboration", "Problem Solving", "Stakeholder Management", "Presentation", "Time Management", "Mentoring"],
            "Healthcare & Life Sciences": [
                "Nursing",
                "Medical Coding",
                "Clinical Research",
                "EHR",
                "Epic",
                "Cerner",
                "Biostatistics",
                "Pharmacovigilance",
                "Regulatory Affairs",
                "Medical Writing",
                "Lab Tech",
            ],
            "Legal & Compliance": [
                "Contracts",
                "Corporate Law",
                "Litigation Support",
                "KYC",
                "AML",
                "GDPR",
                "Privacy",
                "SOX",
                "PCI",
                "Audit",
                "Risk Management",
            ],
            "Education & Training": [
                "Teaching",
                "Curriculum Design",
                "Instructional Design",
                "LMS",
                "Moodle",
                "Canvas",
                "eLearning",
                "Classroom Management",
            ],
            "Human Resources & Talent": [
                "Recruiting",
                "ATS",
                "Greenhouse",
                "Lever",
                "Workday",
                "HRIS",
                "Payroll",
                "L&D",
                "DEI",
                "Onboarding",
            ],
            "Manufacturing & Supply Chain": [
                "Lean",
                "Six Sigma",
                "SCM",
                "Procurement",
                "Inventory",
                "Demand Planning",
                "Logistics",
                "Fleet Management",
                "Warehouse Ops",
                "WMS",
                "Quality Control",
            ],
            "Construction & Facilities": [
                "AutoCAD",
                "Revit",
                "BIM",
                "Estimation",
                "Project Controls",
                "OSHA",
                "HSE",
                "MEP",
                "Site Supervision",
            ],
            "Energy & Utilities": [
                "Oil & Gas",
                "Refinery",
                "Renewable Energy",
                "Solar",
                "Wind",
                "Grid Operations",
                "SCADA",
                "HSE",
            ],
            "Embedded & IoT": [
                "C",
                "C++",
                "Embedded Linux",
                "RTOS",
                "PCB Design",
                "FPGA",
                "MQTT",
                "IoT",
                "Altium",
                "KiCad",
            ],
            "Gaming & 3D": [
                "Unity",
                "Unreal",
                "Blender",
                "Maya",
                "3ds Max",
                "Game Design",
                "Level Design",
                "Rigging",
                "VFX",
            ],
            "Blockchain & Web3": [
                "Solidity",
                "Smart Contracts",
                "web3.js",
                "ethers.js",
                "NFT",
                "DeFi",
                "Wallet Integration",
                "Chainlink",
                "Substrate",
            ],
            "Networking & ITSM": [
                "CCNA",
                "CCNP",
                "Firewalls",
                "SD-WAN",
                "Load Balancing",
                "ITIL",
                "ServiceNow",
                "Helpdesk",
            ],
            "ERP & CRM": [
                "SAP",
                "SAP FI/CO",
                "SAP MM",
                "SAP SD",
                "Oracle ERP",
                "NetSuite",
                "MS Dynamics",
                "Zoho",
                "Freshworks",
            ],
            "QA & Testing": [
                "Manual QA",
                "Test Automation",
                "Cypress",
                "Playwright",
                "Selenium",
                "Performance Testing",
                "JMeter",
                "Gatling",
                "Locust",
                "Mobile QA",
                "UAT",
            ],
            "Hospitality & Retail": [
                "POS Systems",
                "Front Office",
                "F&B",
                "Housekeeping",
                "Visual Merchandising",
                "Store Operations",
                "Inventory Control",
            ],
            "Automotive & Aerospace": [
                "CAD",
                "CAE",
                "CATIA",
                "SolidWorks",
                "ANSYS",
                "CAN bus",
                "AUTOSAR",
                "DO-178C",
                "ADAS",
            ],
            "Insurance & Real Estate": [
                "Underwriting",
                "Claims",
                "Actuarial",
                "Property Management",
                "Brokerage",
            ],
        };

        const skillRows = [];
        Object.entries(skillsByCategory).forEach(([cat, skills]) => {
            const categoryId = categoryIdByName.get(cat) || null;
            skills.forEach((name) => {
                skillRows.push({
                    name,
                    slug: slugify(name),
                    description: `${name} skill`,
                    categoryId,
                    createdAt: now,
                    updatedAt: now,
                });
            });
        });

        // Dedupe skills by slug to avoid validation errors
        const seen = new Set();
        const uniqueSkills = [];
        for (const row of skillRows) {
            if (seen.has(row.slug)) continue;
            seen.add(row.slug);
            uniqueSkills.push(row);
        }

        await queryInterface.bulkInsert("Skills", uniqueSkills);
    },

    async down(queryInterface) {
        await queryInterface.bulkDelete("Skills", null, {});
        await queryInterface.bulkDelete("SkillCategories", null, {});
    },
};
