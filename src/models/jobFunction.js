"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class JobFunction extends Model { }

  JobFunction.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      description: DataTypes.TEXT,
      parentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      isFeatured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      seoTitle: DataTypes.STRING,
      seoDescription: DataTypes.TEXT,
      seoKeywords: DataTypes.TEXT,
      canonicalUrl: DataTypes.STRING,
      metaImage: DataTypes.STRING,
      schemaType: {
        type: DataTypes.STRING,
        defaultValue: "CategoryCode",
      },
      faqSchema: DataTypes.JSON,
      tags: DataTypes.JSON,
    },
    {
      sequelize,
      modelName: "JobFunction",
      tableName: "JobFunctions",
    }
  );

  return JobFunction;
};
