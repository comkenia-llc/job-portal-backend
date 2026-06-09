'use strict';

module.exports = (sequelize, DataTypes) => {
  const SavedJob = sequelize.define(
    'SavedJob',
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      jobId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: 'SavedJobs',
    }
  );

  return SavedJob;
};
