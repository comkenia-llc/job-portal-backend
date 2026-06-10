"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class Location extends Model { }

    Location.init(
        {
            // 🌍 Core Fields
            name: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            market: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "global",
            },
            country: DataTypes.STRING,
            countryCode: DataTypes.STRING,
            state: DataTypes.STRING,
            city: DataTypes.STRING,
            slug: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                comment: "URL-friendly slug, e.g. 'united-kingdom' or 'london-uk'",
            },

            latitude: DataTypes.DECIMAL(10, 6),
            longitude: DataTypes.DECIMAL(10, 6),
            continent: DataTypes.STRING,
            timezone: DataTypes.STRING,
            currency: {
                type: DataTypes.STRING,
                defaultValue: "USD",
            },
            flag: {
                type: DataTypes.STRING,
                defaultValue: "/uploads/locations/flags/default.png",
            },
            parentId: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            type: {
                type: DataTypes.ENUM("country", "state", "city", "neighborhood"),
                allowNull: false,
                defaultValue: "country",
            },

            // 🖼️ Image for region thumbnail
            image: {
                type: DataTypes.STRING,
                allowNull: true,
                comment: "Representative image of the location for UI display",
            },

            // ⭐ NEW FIELD
            isFeatured: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
                comment: "Marks this location as featured for homepage or highlights",
            },

            // 🔍 SEO Fields
            seoTitle: {
                type: DataTypes.STRING,
                allowNull: true,
                comment: "SEO-optimized title, e.g. 'Top LLM Universities in London 2025'",
            },
            seoDescription: {
                type: DataTypes.TEXT,
                allowNull: true,
                comment: "Meta description for search results",
            },
            seoKeywords: {
                type: DataTypes.STRING,
                allowNull: true,
                comment: "Comma-separated keywords for SEO targeting",
            },
            canonicalUrl: {
                type: DataTypes.STRING,
                allowNull: true,
                comment: "Canonical URL for avoiding duplicate pages",
            },
            metaImage: {
                type: DataTypes.STRING,
                allowNull: true,
                comment: "Image used for Open Graph / social previews",
            },
            schemaType: {
                type: DataTypes.STRING,
                allowNull: true,
                defaultValue: "Place",
                comment: "Used for JSON-LD structured data",
            },
            // 📝 Rich Content Fields

            overview: {
                type: DataTypes.TEXT("long"),
                allowNull: true,
                comment: "Main location guide content displayed on the page",
            },

            workCulture: {
                type: DataTypes.TEXT("long"),
                allowNull: true,
                comment: "Work environment and culture in this location",
            },

            jobMarketOverview: {
                type: DataTypes.TEXT("long"),
                allowNull: true,
                comment: "Overview of hiring demand and employment opportunities",
            },

            popularIndustries: {
                type: DataTypes.JSON,
                allowNull: true,
                comment: "Array of industries popular in this location",
            },

            popularJobTypes: {
                type: DataTypes.JSON,
                allowNull: true,
                comment: "Array of common job titles or job categories",
            },

            transportNotes: {
                type: DataTypes.TEXT("long"),
                allowNull: true,
                comment: "Transport, roads, metro, bus, airport, commute information",
            },

            lifestyleNotes: {
                type: DataTypes.TEXT("long"),
                allowNull: true,
                comment: "Lifestyle, affordability, family suitability, entertainment",
            },

            nearbyAreas: {
                type: DataTypes.JSON,
                allowNull: true,
                comment: "Array of nearby areas for internal linking",
            },

            candidateTips: {
                type: DataTypes.TEXT("long"),
                allowNull: true,
                comment: "Advice for candidates seeking jobs in this location",
            },

            employerNotes: {
                type: DataTypes.TEXT("long"),
                allowNull: true,
                comment: "Advice for employers hiring in this location",
            },

            // 📈 Content Management

            contentStatus: {
                type: DataTypes.ENUM(
                    "empty",
                    "draft",
                    "reviewed",
                    "published"
                ),
                allowNull: false,
                defaultValue: "empty",
                comment: "Content workflow status",
            },

            indexStatus: {
                type: DataTypes.ENUM(
                    "auto",
                    "index",
                    "noindex"
                ),
                allowNull: false,
                defaultValue: "auto",
                comment: "Manual indexing control",
            },
            faqSchema: {
                type: DataTypes.JSON,
                allowNull: true,
                comment: "Array of Q&A objects for Google rich results",
            },
            tags: {
                type: DataTypes.JSON,
                allowNull: true,
                comment: "Array of related topics, e.g. ['LLM in London', 'Law Universities in UK']",
            },
            lastUpdated: {
                type: DataTypes.DATE,
                allowNull: true,
                defaultValue: DataTypes.NOW,
                comment: "For showing 'Updated on' info on frontend",
            },

            // 💸 Affordability metadata (optional)
            affordabilityTier: {
                type: DataTypes.STRING,
                allowNull: true,
                comment: "budget | mid | premium",
            },
            rentMultiplier: {
                type: DataTypes.DECIMAL(5, 2),
                allowNull: true,
                comment: "Neighborhood rent multiplier, e.g. 0.9 or 1.25",
            },
        },
        {
            sequelize,
            modelName: "Location",
            tableName: "locations",
            timestamps: true,
            // underscored: true,
            hooks: {
                beforeValidate: (location) => {
                    // generate slug safely
                    const baseSlug = [
                        location.city,
                        location.state,
                        location.country,
                    ]
                        .filter(Boolean)
                        .join("-")
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                        .replace(/[^a-z0-9-]/g, "");

                    if (!location.slug && baseSlug) {
                        location.slug = baseSlug;
                    }

                    // generate canonical URL automatically
                    const publicBaseUrl = String(process.env.PUBLIC_APP_URL || "").trim().replace(/\/+$/, "");
                    if (!location.canonicalUrl && location.slug && publicBaseUrl) {
                        location.canonicalUrl = `${publicBaseUrl}/locations/${location.slug}`;
                    }
                },
            },

        }
    );

    return Location;
};
