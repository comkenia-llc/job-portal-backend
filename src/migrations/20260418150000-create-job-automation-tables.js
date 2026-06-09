'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('JobIngestionQueues', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      status: {
        type: Sequelize.ENUM('pending', 'resolved', 'published', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
      },
      reasonCode: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      sourceType: {
        type: Sequelize.ENUM('company', 'government'),
        allowNull: false,
      },
      sourceName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      sourceUrl: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      sourceCanonicalUrl: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      sourceHost: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      sourceExternalId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      sourcePostedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      crawlerFetchedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      locationText: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      companyName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      applicationUrl: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      payload: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      contentFingerprint: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      dedupeKey: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      companyId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Companies', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      locationId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'locations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      publishedJobId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Jobs', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      reviewedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      reviewNotes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      resolvedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addIndex('JobIngestionQueues', ['status'], {
      name: 'job_ingestion_queue_status_idx',
    });
    await queryInterface.addIndex('JobIngestionQueues', ['reasonCode'], {
      name: 'job_ingestion_queue_reason_idx',
    });
    await queryInterface.addIndex('JobIngestionQueues', ['sourceHost'], {
      name: 'job_ingestion_queue_source_host_idx',
    });
    await queryInterface.addIndex('JobIngestionQueues', ['dedupeKey'], {
      name: 'job_ingestion_queue_dedupe_idx',
    });

    await queryInterface.createTable('JobDedupFingerprints', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      sourceCanonicalUrl: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      sourceUrlHash: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      sourceExternalId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      sourceHost: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      contentFingerprint: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      companyId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Companies', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      locationId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'locations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      sourceType: {
        type: Sequelize.ENUM('company', 'government'),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('published', 'queued', 'rejected'),
        allowNull: false,
        defaultValue: 'published',
      },
      jobId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Jobs', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      queueId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'JobIngestionQueues', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      meta: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addIndex('JobDedupFingerprints', ['sourceUrlHash'], {
      name: 'job_dedup_source_url_hash_uq',
      unique: true,
    });
    await queryInterface.addIndex('JobDedupFingerprints', ['contentFingerprint'], {
      name: 'job_dedup_content_fingerprint_uq',
      unique: true,
    });
    await queryInterface.addIndex('JobDedupFingerprints', ['sourceHost', 'sourceExternalId'], {
      name: 'job_dedup_external_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('JobDedupFingerprints', 'job_dedup_external_idx');
    await queryInterface.removeIndex('JobDedupFingerprints', 'job_dedup_content_fingerprint_uq');
    await queryInterface.removeIndex('JobDedupFingerprints', 'job_dedup_source_url_hash_uq');
    await queryInterface.dropTable('JobDedupFingerprints');

    await queryInterface.removeIndex('JobIngestionQueues', 'job_ingestion_queue_dedupe_idx');
    await queryInterface.removeIndex('JobIngestionQueues', 'job_ingestion_queue_source_host_idx');
    await queryInterface.removeIndex('JobIngestionQueues', 'job_ingestion_queue_reason_idx');
    await queryInterface.removeIndex('JobIngestionQueues', 'job_ingestion_queue_status_idx');
    await queryInterface.dropTable('JobIngestionQueues');
  },
};
