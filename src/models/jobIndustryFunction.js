"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class JobIndustryFunction extends Model {}

  JobIndustryFunction.init(
    {
      jobIndustryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      jobFunctionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "JobIndustryFunction",
      tableName: "JobIndustryFunctions",
    }
  );

  return JobIndustryFunction;
};
