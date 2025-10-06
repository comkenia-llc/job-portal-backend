'use strict';
module.exports = (sequelize, DataTypes) => {
  const Company = sequelize.define('Company', {
    name: { type: DataTypes.STRING, allowNull: false },
    legalName: DataTypes.STRING,
    industry: DataTypes.STRING,
    size: DataTypes.STRING,  // later we can make ENUM
    logoUrl: DataTypes.STRING,
    bannerUrl: DataTypes.STRING,
    tagline: DataTypes.STRING,
    about: DataTypes.TEXT,
    website: DataTypes.STRING,
    email: DataTypes.STRING,
    phone: DataTypes.STRING,
    headquarters: DataTypes.STRING,
    
    locationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Locations', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },

    locations: DataTypes.TEXT, // JSON string with multiple branches
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
    }
  }, {
    tableName: 'Companies'
  });

  return Company;
};
