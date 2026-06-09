"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class CompanyCategory extends Model {}

  CompanyCategory.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      description: DataTypes.TEXT,
      content: DataTypes.TEXT,
      faqs: DataTypes.TEXT,
      isFeatured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      parentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "CompanyCategory",
      tableName: "CompanyCategories",
    }
  );

  return CompanyCategory;
};
