'use strict';
module.exports = (sequelize, DataTypes) => {
  const CompanyReview = sequelize.define('CompanyReview', {
    companyId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },

    ratingOverall: { type: DataTypes.INTEGER, allowNull: false }, // 1-5
    ratingWorkLifeBalance: DataTypes.INTEGER,
    ratingCulture: DataTypes.INTEGER,
    ratingManagement: DataTypes.INTEGER,

    title: DataTypes.STRING,
    pros: DataTypes.TEXT,
    cons: DataTypes.TEXT,
    adviceToManagement: DataTypes.TEXT,

    recommendToFriend: { type: DataTypes.BOOLEAN, defaultValue: false },
    employmentStatus: {
      type: DataTypes.ENUM('current', 'former'),
      allowNull: false,
      defaultValue: 'current'
    },
    jobTitle: DataTypes.STRING,
    location: DataTypes.STRING,

    reviewDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'CompanyReviews'
  });

  return CompanyReview;
};
