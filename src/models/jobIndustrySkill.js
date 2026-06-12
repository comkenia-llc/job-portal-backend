"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class JobIndustrySkill extends Model {}

  JobIndustrySkill.init(
    {
      jobIndustryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      skillId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "JobIndustrySkill",
      tableName: "JobIndustrySkills",
    }
  );

  return JobIndustrySkill;
};
