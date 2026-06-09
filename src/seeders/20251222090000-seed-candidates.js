"use strict";

const bcrypt = require("bcrypt");

module.exports = {
    async up(queryInterface) {
        const passwordHash = await bcrypt.hash("Password123!", 10);
        const now = new Date();

        const firstNames = [
            "Aisha",
            "Omar",
            "Zara",
            "Liam",
            "Noah",
            "Olivia",
            "Emma",
            "Sophia",
            "Ethan",
            "Mia",
            "Lucas",
            "Mateo",
            "Isabella",
            "Amelia",
            "Yuki",
            "Hana",
            "Diego",
            "Carlos",
            "Jorge",
            "Sara",
        ];
        const lastNames = [
            "Khan",
            "Smith",
            "Johnson",
            "Ahmed",
            "Patel",
            "Lee",
            "Garcia",
            "Hernandez",
            "Brown",
            "Taylor",
            "Nguyen",
            "Kim",
            "Lopez",
            "Fernandez",
            "Martinez",
            "Singh",
            "Wong",
            "Chen",
            "Silva",
            "Rossi",
        ];
        const locations = [
            "Dubai",
            "Abu Dhabi",
            "Sharjah",
            "Riyadh",
            "Jeddah",
            "Doha",
            "Cairo",
            "Karachi",
            "Lahore",
            "Istanbul",
            "London",
            "New York",
            "Toronto",
            "Sydney",
            "Singapore",
            "Tokyo",
            "Seoul",
            "Madrid",
            "Mexico City",
            "Nairobi",
        ];
        const nationalities = [
            "UAE",
            "Pakistan",
            "India",
            "Saudi Arabia",
            "Egypt",
            "Philippines",
            "UK",
            "USA",
            "Canada",
            "Turkey",
            "Australia",
            "South Korea",
            "Japan",
            "Mexico",
            "Spain",
            "Kenya",
            "Brazil",
            "Germany",
            "France",
            "South Africa",
        ];
        const headlines = [
            "Full-stack Developer",
            "Product Manager",
            "Data Analyst",
            "Marketing Specialist",
            "Sales Executive",
            "UI/UX Designer",
            "DevOps Engineer",
            "QA Engineer",
            "Finance Associate",
            "Customer Success",
            "Mobile Developer",
            "Data Engineer",
            "Cloud Architect",
            "IT Support Specialist",
        ];
        const jobTypes = ["full-time", "part-time", "contract", "internship", "remote"];
        const skillPool = ["JavaScript", "TypeScript", "React", "Node.js", "Express", "Next.js", "SQL", "NoSQL", "AWS", "Docker", "Kubernetes", "Python", "Django", "Laravel", "Figma", "Salesforce", "Communication", "Leadership", "Project Management", "Data Analysis"];
        const languagePool = ["English", "Arabic", "Urdu", "Hindi", "French", "Spanish"];

        const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
        const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
        const pickMany = (arr, count) => {
            const copy = [...arr];
            const picked = [];
            const n = Math.min(count, copy.length);
            for (let i = 0; i < n; i++) {
                const idx = Math.floor(Math.random() * copy.length);
                picked.push(copy.splice(idx, 1)[0]);
            }
            return picked;
        };

        const candidates = Array.from({ length: 500 }, (_, i) => {
            const firstName = rand(firstNames);
            const lastName = rand(lastNames);
            const username = `seedcandidate${String(i + 1).padStart(4, "0")}`;
            const email = `${username}@example.com`;
            const location = rand(locations);
            const nationality = rand(nationalities);
            const headline = rand(headlines);
            const preferredJobType = rand(jobTypes);
            const skills = pickMany(skillPool, randInt(3, 7));
            const languages = pickMany(languagePool, randInt(1, 3));
            const expYears = randInt(1, 10);
            const salaryMin = randInt(3000, 12000);
            const salaryMax = salaryMin + randInt(2000, 8000);
            const isAvailable = Math.random() > 0.3;
            const dob = new Date();
            dob.setFullYear(dob.getFullYear() - randInt(22, 45));

            const workHistory = [
                {
                    title: rand(headlines),
                    company: "Acme Corp",
                    startDate: "2020-01-01",
                    endDate: "2023-12-31",
                    responsibilities: ["Built features", "Collaborated with team"],
                },
            ];

            return {
                user: {
                    username,
                    email,
                    firstName,
                    lastName,
                    passwordHash,
                    role: "candidate",
                    status: "active",
                    headline,
                    location,
                    phone: `050${randInt(1000000, 9999999)}`,
                    about: `Professional ${headline} with ${expYears}+ years of experience.`,
                    avatarUrl: `https://i.pravatar.cc/300?u=${username}`,
                    createdAt: now,
                    updatedAt: now,
                },
                profile: {
                    firstName,
                    lastName,
                    email,
                    phone: `050${randInt(1000000, 9999999)}`,
                    location,
                    headline,
                    bio: `Experienced ${headline} based in ${location}.`,
                    experienceYears: expYears,
                    skills,
                    languages,
                    isAvailable,
                    preferredJobType,
                    expectedSalaryMin: salaryMin,
                    expectedSalaryMax: salaryMax,
                    currency: "USD",
                    nationality,
                    dateOfBirth: dob,
                    gender: rand(["male", "female", "other"]),
                    workHistory,
                    educationHistory: [
                        { degree: "Bachelors", school: "Global University", startDate: "2014-01-01", endDate: "2018-01-01", field: "Computer Science" },
                    ],
                    certifications: [{ name: "Certification", authority: "Issuer", year: 2022 }],
                    createdAt: now,
                    updatedAt: now,
                },
            };
        });

        // Insert users
        await queryInterface.bulkInsert("Users", candidates.map((c) => c.user));

        // Fetch inserted user IDs
        const [rows] = await queryInterface.sequelize.query(
            `SELECT id, email FROM Users WHERE email LIKE 'seedcandidate%@example.com';`
        );
        const idByEmail = new Map(rows.map((r) => [r.email, r.id]));

        const profiles = candidates
            .map((c) => {
                const userId = idByEmail.get(c.user.email);
                if (!userId) return null;
                const profile = { ...c.profile, userId };
                // Ensure JSON fields are stringified for MySQL compatibility
                if (profile.skills) profile.skills = JSON.stringify(profile.skills);
                if (profile.languages) profile.languages = JSON.stringify(profile.languages);
                if (profile.workHistory) profile.workHistory = JSON.stringify(profile.workHistory);
                if (profile.educationHistory) profile.educationHistory = JSON.stringify(profile.educationHistory);
                if (profile.certifications) profile.certifications = JSON.stringify(profile.certifications);
                return profile;
            })
            .filter(Boolean);

        if (profiles.length) {
            await queryInterface.bulkInsert("CandidateProfiles", profiles);
        }
    },

    async down(queryInterface) {
        const [rows] = await queryInterface.sequelize.query(
            `SELECT id FROM Users WHERE email LIKE 'seedcandidate%@example.com';`
        );
        const ids = rows.map((r) => r.id);
        if (ids.length) {
            await queryInterface.bulkDelete("CandidateProfiles", { userId: ids });
            await queryInterface.bulkDelete("Users", { id: ids });
        }
    },
};
