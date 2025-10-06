'use strict';
module.exports = (sequelize, DataTypes) => {
  const EmployerProfile = sequelize.define('EmployerProfile', {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    companyId: { type: DataTypes.INTEGER },
    jobTitle: DataTypes.STRING,
    department: DataTypes.STRING,
    phone: DataTypes.STRING,
    email: DataTypes.STRING,
    avatarUrl: DataTypes.STRING,
    linkedinUrl: DataTypes.STRING,
    bio: DataTypes.TEXT,
    status: {
      type: DataTypes.ENUM('active', 'suspended', 'pending'),
      defaultValue: 'active'
    },
    verified: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, {
    tableName: 'EmployerProfiles'
  });

  return EmployerProfile;
};
