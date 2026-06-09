'use strict';
module.exports = (sequelize, DataTypes) => {
  const CandidateProfile = sequelize.define('CandidateProfile', {
    userId: { type: DataTypes.INTEGER, allowNull: false },

    // Personal info
    firstName: { type: DataTypes.STRING, allowNull: false },
    lastName: { type: DataTypes.STRING, allowNull: false },
    phone: DataTypes.STRING,
    email: DataTypes.STRING, // can sync with Users.email
    dateOfBirth: DataTypes.DATE,
    gender: DataTypes.ENUM('male', 'female', 'other'),
    location: DataTypes.STRING,
    nationality: DataTypes.STRING,

    // Resume summary
    headline: DataTypes.STRING,
    bio: DataTypes.TEXT,

    // Experience & education
    experienceYears: DataTypes.INTEGER,
    workHistory: DataTypes.JSON,       // [{title, company, startDate, endDate, responsibilities}]
    educationHistory: DataTypes.JSON,  // [{degree, school, startDate, endDate, field}]
    certifications: DataTypes.JSON,    // [{name, authority, year}]

    // Skills & languages
    skills: DataTypes.JSON,            // ["React", "Node.js", "SQL"]
    languages: DataTypes.JSON,         // [{language: "English", level: "Fluent"}]

    // Preferences
    isAvailable: { type: DataTypes.BOOLEAN, defaultValue: true },
    preferredJobType: {
      type: DataTypes.ENUM('full-time', 'part-time', 'contract', 'internship', 'remote')
    },
    expectedSalaryMin: DataTypes.INTEGER,
    expectedSalaryMax: DataTypes.INTEGER,
    currency: { type: DataTypes.STRING, defaultValue: 'USD' }
  }, {
    tableName: 'CandidateProfiles'
  });

  return CandidateProfile;
};
