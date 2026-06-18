'use strict';
module.exports = (sequelize, DataTypes) => {
  const Company = sequelize.define('Company', {
    name: { type: DataTypes.STRING, allowNull: false },
    market: { type: DataTypes.STRING, allowNull: false, defaultValue: 'global' },
    legalName: DataTypes.STRING,
    slug: { type: DataTypes.STRING, allowNull: false, unique: true },
    industry: DataTypes.STRING,
    size: DataTypes.STRING,
    logoUrl: DataTypes.STRING,
    bannerUrl: DataTypes.STRING,
    tagline: DataTypes.STRING,
    about: DataTypes.TEXT,
    website: DataTypes.STRING,
    email: DataTypes.STRING,
    phone: DataTypes.STRING,
    headquarters: DataTypes.STRING,
    companyCategoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'CompanyCategories', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },

    locationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Locations', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },

    locations: DataTypes.TEXT,
    linkedinUrl: DataTypes.STRING,
    facebookUrl: DataTypes.STRING,
    twitterUrl: DataTypes.STRING,
    glassdoorUrl: DataTypes.STRING,
    foundedYear: DataTypes.INTEGER,
    verified: { type: DataTypes.BOOLEAN, defaultValue: false },
    status: { type: DataTypes.ENUM('active', 'suspended', 'pending'), defaultValue: 'active' },

    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // 🧠 SEO Metadata Fields
    seoTitle: DataTypes.STRING,
    seoDescription: DataTypes.TEXT,
    seoKeywords: DataTypes.TEXT,
    canonicalUrl: DataTypes.STRING,
    metaImage: DataTypes.STRING,
    schemaType: DataTypes.STRING,
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    notificationPreferences: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    communicationPreferences: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  }, {
    tableName: 'Companies'
  });

  return Company;
};
