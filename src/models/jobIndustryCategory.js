"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class JobIndustryCategory extends Model {}

  JobIndustryCategory.init(
    {
      jobIndustryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      jobCategoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "JobIndustryCategory",
      tableName: "JobIndustryCategories",
    }
  );

  return JobIndustryCategory;
};
