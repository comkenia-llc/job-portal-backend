'use strict';
module.exports = (sequelize, DataTypes) => {
  const Salary = sequelize.define('Salary', {
    companyId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER },

    jobTitle: { type: DataTypes.STRING, allowNull: false },
    salaryMin: { type: DataTypes.INTEGER, allowNull: false },
    salaryMax: { type: DataTypes.INTEGER, allowNull: false },
    currency: { type: DataTypes.STRING, defaultValue: 'USD' },

    frequency: {
      type: DataTypes.ENUM('monthly', 'yearly', 'hourly'),
      defaultValue: 'monthly'
    },
    location: DataTypes.STRING,
    experienceLevel: {
      type: DataTypes.ENUM('entry', 'mid', 'senior', 'lead'),
      defaultValue: 'entry'
    },
    employmentType: {
      type: DataTypes.ENUM('full-time', 'part-time', 'contract', 'internship'),
      defaultValue: 'full-time'
    },

    submittedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'Salaries'
  });

  return Salary;
};
