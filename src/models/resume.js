"use strict";
module.exports = (sequelize, DataTypes) => {
    const Resume = sequelize.define(
        "Resume",
        {
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            title: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            template: {
                type: DataTypes.JSON,
                defaultValue: {
                    id: "modern-yellow",
                    label: "Modern Yellow"
                },
            },

            photoUrl: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            publicSlug: {
                type: DataTypes.STRING,
                unique: true,
            },
            isPublic: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            isDefault: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },

            // 🧍 Personal Info
            personalInfo: {
                type: DataTypes.JSON,
                allowNull: true,
            },

            summary: {
                type: DataTypes.TEXT,
                allowNull: true,
            },

            // 💼 Work Experience
            experience: {
                type: DataTypes.JSON,
                allowNull: true,
            },

            // 🎓 Education
            education: {
                type: DataTypes.JSON,
                allowNull: true,
            },

            // 🧠 Skills
            skills: {
                type: DataTypes.JSON,
                allowNull: true,
            },

            // 🌍 Languages
            languages: {
                type: DataTypes.JSON,
                allowNull: true,
            },

            // 💡 Projects / Portfolio
            projects: {
                type: DataTypes.JSON,
                allowNull: true,
            },

            // 🏅 Certifications / Awards
            certifications: {
                type: DataTypes.JSON,
                allowNull: true,
            },
            awards: {
                type: DataTypes.JSON,
                allowNull: true,
            },

            // ❤️ Interests / Hobbies
            interests: {
                type: DataTypes.JSON,
                allowNull: true,
            },

            // 📑 Custom Sections
            customSections: {
                type: DataTypes.JSON,
                allowNull: true,
            },

            // 🎨 Styling
            colorTheme: {
                type: DataTypes.STRING,
                defaultValue: "#2563eb",
            },
            fontStyle: {
                type: DataTypes.STRING,
                defaultValue: "Inter",
            },

            // 📄 Generated Output
            lastGeneratedPdf: {
                type: DataTypes.STRING,
                allowNull: true,
            },
        },
        {
            tableName: "Resumes",
        }
    );

    return Resume;
};
