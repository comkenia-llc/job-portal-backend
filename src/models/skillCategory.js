"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class SkillCategory extends Model { }

  SkillCategory.init(
    {
      name: { type: DataTypes.STRING, allowNull: false },
      slug: { type: DataTypes.STRING, allowNull: false, unique: true },
      description: DataTypes.TEXT,
      isFeatured: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    {
      sequelize,
      modelName: "SkillCategory",
      tableName: "SkillCategories",
    }
  );

  return SkillCategory;
};
