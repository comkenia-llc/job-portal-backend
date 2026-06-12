"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class JobIndustry extends Model {
    static associate(models) {
      JobIndustry.hasMany(models.Job, {
        foreignKey: "jobIndustryId",
        as: "jobs",
      });
    }
  }

  JobIndustry.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      market: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "global",
      },
      description: DataTypes.TEXT,
      content: DataTypes.TEXT,
      seoTitle: DataTypes.STRING,
      seoDescription: DataTypes.TEXT,
      seoKeywords: DataTypes.TEXT,
      canonicalUrl: DataTypes.STRING,
      metaImage: DataTypes.STRING,
      schemaType: {
        type: DataTypes.STRING,
        defaultValue: "DefinedTerm",
      },
      faqSchema: DataTypes.JSON,
      tags: DataTypes.JSON,
      isFeatured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: "active",
      },
    },
    {
      sequelize,
      modelName: "JobIndustry",
      tableName: "JobIndustries",
    }
  );

  return JobIndustry;
};
