"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class JobSkill extends Model { }

  JobSkill.init(
    {
      jobId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      skillId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      isPrimary: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "JobSkill",
      tableName: "JobSkills",
    }
  );

  return JobSkill;
};
