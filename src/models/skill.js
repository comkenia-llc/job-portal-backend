"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Skill extends Model { }

  Skill.init(
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
      category: DataTypes.STRING,
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "SkillCategories", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
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
        defaultValue: "DefinedTerm",
      },
      faqSchema: DataTypes.JSON,
      tags: DataTypes.JSON,
    },
    {
      sequelize,
      modelName: "Skill",
      tableName: "Skills",
    }
  );

  return Skill;
};
