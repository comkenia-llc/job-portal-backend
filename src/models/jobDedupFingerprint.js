'use strict';

module.exports = (sequelize, DataTypes) => {
  const JobDedupFingerprint = sequelize.define(
    'JobDedupFingerprint',
    {
      sourceCanonicalUrl: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      sourceUrlHash: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      sourceExternalId: DataTypes.STRING,
      sourceHost: DataTypes.STRING,
      contentFingerprint: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      companyId: DataTypes.INTEGER,
      locationId: DataTypes.INTEGER,
      sourceType: {
        type: DataTypes.ENUM('company', 'government'),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('published', 'queued', 'rejected'),
        allowNull: false,
        defaultValue: 'published',
      },
      jobId: DataTypes.INTEGER,
      queueId: DataTypes.INTEGER,
      meta: DataTypes.JSON,
    },
    {
      tableName: 'JobDedupFingerprints',
    }
  );

  return JobDedupFingerprint;
};
