"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Job extends Model { }

  Job.init(
    {
      // 🎯 Core Job Fields
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM(
          "full-time",
          "part-time",
          "contract",
          "internship",
          "temporary",
          "remote"
        ),
        allowNull: false,
        defaultValue: "full-time",
      },
      location: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      remote: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      salaryMin: DataTypes.INTEGER,
      salaryMax: DataTypes.INTEGER,
      currency: {
        type: DataTypes.STRING,
        defaultValue: "USD",
      },
      status: {
        type: DataTypes.ENUM("open", "closed", "draft"),
        defaultValue: "open",
      },
      experienceLevel: {
        type: DataTypes.ENUM(
          "entry",
          "junior",
          "mid",
          "senior",
          "lead",
          "executive"
        ),
      },
      educationLevel: {
        type: DataTypes.ENUM(
          "none",
          "highschool",
          "bachelor",
          "master",
          "phd",
          "other"
        ),
      },
      industry: DataTypes.STRING,
      skills: DataTypes.TEXT,
      applicationUrl: DataTypes.STRING,
      deadline: DataTypes.DATE,
      views: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      postedBy: DataTypes.INTEGER,
      companyId: DataTypes.INTEGER,
      locationId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      // 🌟 SEO Metadata Fields
      seoTitle: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      seoDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      seoKeywords: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      canonicalUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      metaImage: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      schemaType: {
        type: DataTypes.STRING,
        defaultValue: "JobPosting",
      },
      faqSchema: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      tags: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      isFeatured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      jobCategoryId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      jobSubCategoryId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Job",
      tableName: "Jobs",
    }
  );

  return Job;
};
