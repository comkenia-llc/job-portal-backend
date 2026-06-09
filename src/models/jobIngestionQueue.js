'use strict';

module.exports = (sequelize, DataTypes) => {
  const JobIngestionQueue = sequelize.define(
    'JobIngestionQueue',
    {
      status: {
        type: DataTypes.ENUM('pending', 'resolved', 'published', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
      },
      reasonCode: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      sourceType: {
        type: DataTypes.ENUM('company', 'government'),
        allowNull: false,
      },
      sourceName: DataTypes.STRING,
      sourceUrl: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      sourceCanonicalUrl: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      sourceHost: DataTypes.STRING,
      sourceExternalId: DataTypes.STRING,
      sourcePostedAt: DataTypes.DATE,
      crawlerFetchedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      locationText: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      companyName: DataTypes.STRING,
      applicationUrl: DataTypes.TEXT,
      payload: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      contentFingerprint: DataTypes.STRING,
      dedupeKey: DataTypes.STRING,
      companyId: DataTypes.INTEGER,
      locationId: DataTypes.INTEGER,
      publishedJobId: DataTypes.INTEGER,
      reviewedBy: DataTypes.INTEGER,
      reviewNotes: DataTypes.TEXT,
      resolvedAt: DataTypes.DATE,
    },
    {
      tableName: 'JobIngestionQueues',
    }
  );

  return JobIngestionQueue;
};
