'use strict';
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    username: { type: DataTypes.STRING, unique: true, allowNull: false },
    firstName: { type: DataTypes.STRING, allowNull: true },
    lastName: { type: DataTypes.STRING, allowNull: true },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('candidate', 'employer', 'admin'), defaultValue: 'candidate' },
    avatarUrl: DataTypes.STRING,
    headline: DataTypes.STRING,
    phone: DataTypes.STRING,
    location: DataTypes.STRING,
    linkedinUrl: DataTypes.STRING,
    portfolioUrl: DataTypes.STRING,
    about: DataTypes.TEXT,
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Companies', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },

    status: { type: DataTypes.ENUM('active', 'suspended', 'pending'), defaultValue: 'active' },
    emailVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
    lastLogin: DataTypes.DATE,
    googleId: DataTypes.STRING,
    facebookId: DataTypes.STRING,
    linkedinId: DataTypes.STRING
  }, {
    tableName: 'Users'   // 👈 make sure matches migration
  });

  return User;
};
