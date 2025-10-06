'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Job extends Model { }

  Job.init({
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('full-time', 'part-time', 'contract', 'internship', 'temporary', 'remote'),
      allowNull: false,
      defaultValue: 'full-time'
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false
    },
    remote: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    salaryMin: {
      type: DataTypes.INTEGER
    },
    salaryMax: {
      type: DataTypes.INTEGER
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'USD'
    },
    status: {
      type: DataTypes.ENUM('open', 'closed', 'draft'),
      defaultValue: 'open'
    },
    experienceLevel: {
      type: DataTypes.ENUM('entry', 'junior', 'mid', 'senior', 'lead', 'executive')
    },
    educationLevel: {
      type: DataTypes.ENUM('none', 'highschool', 'bachelor', 'master', 'phd', 'other')
    },
    industry: {
      type: DataTypes.STRING
    },
    skills: {
      type: DataTypes.TEXT
    },
    applicationUrl: {
      type: DataTypes.STRING
    },
    deadline: {
      type: DataTypes.DATE
    },
    views: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    postedBy: {
      type: DataTypes.INTEGER
    },
    companyId: {
      type: DataTypes.INTEGER
    },
    locationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

  }, {
    sequelize,
    modelName: 'Job',
    tableName: 'Jobs'
  });

  return Job;
};
