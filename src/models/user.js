'use strict';
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    username: { type: DataTypes.STRING, unique: true, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('candidate', 'employer', 'admin'), defaultValue: 'candidate' },
    avatarUrl: DataTypes.STRING,
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
