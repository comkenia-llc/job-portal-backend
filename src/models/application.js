'use strict';
module.exports = (sequelize, DataTypes) => {
  const Application = sequelize.define('Application', {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    jobId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    status: {
      type: DataTypes.ENUM('pending', 'reviewed', 'interview', 'offered', 'hired', 'rejected'),
      allowNull: false,
      defaultValue: 'pending'
    },

    appliedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    viewedAt: {
      type: DataTypes.DATE
    },
    stageUpdatedAt: {
      type: DataTypes.DATE
    },

    isWithdrawn: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    notes: {
      type: DataTypes.TEXT
    },
    trackingId: {
      type: DataTypes.STRING
    },
    source: {
      type: DataTypes.STRING
    }
  }, {
    tableName: 'Applications'
  });

  return Application;
};
