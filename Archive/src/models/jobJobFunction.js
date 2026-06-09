"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class JobJobFunction extends Model { }

  JobJobFunction.init(
    {
      jobId: {
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
      modelName: "JobJobFunction",
      tableName: "JobJobFunctions",
    }
  );

  return JobJobFunction;
};
