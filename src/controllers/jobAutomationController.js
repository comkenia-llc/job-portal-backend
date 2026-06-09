'use strict';

const { Op } = require('sequelize');
const {
  JobIngestionQueue,
  JobDedupFingerprint,
  Company,
} = require('../models');
const { runJobAutomation } = require('../services/jobAutomation/runAutomation');
const { normalizeRawJob } = require('../services/jobAutomation/normalizeJob');
const { validateAndResolve } = require('../services/jobAutomation/validateJob');
const { buildKeys, isDuplicate, saveFingerprint } = require('../services/jobAutomation/dedupeService');
const { publishJob } = require('../services/jobAutomation/publishService');

exports.runAutomation = async (req, res) => {
  try {
    const rawJobs = Array.isArray(req.body?.jobs) ? req.body.jobs : null;
    const dryRun = req.body?.dryRun === true || req.body?.dryRun === 'true';
    const maxPerDay = Number(req.body?.maxPerDay || req.body?.dailyLimit || 100);

    const report = await runJobAutomation({
      actorUserId: req.user.id,
      maxPerDay,
      rawJobs,
      dryRun,
    });

    res.json({
      message: dryRun ? 'Automation dry-run completed' : 'Automation run completed',
      report,
    });
  } catch (error) {
    console.error('❌ runAutomation error:', error);
    res.status(500).json({ error: 'Failed to run job automation', details: error.message });
  }
};

exports.getAutomationReport = async (_req, res) => {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [published, queued, rejected, pendingQueue, recentQueue] = await Promise.all([
      JobDedupFingerprint.count({ where: { status: 'published', createdAt: { [Op.gte]: since } } }),
      JobDedupFingerprint.count({ where: { status: 'queued', createdAt: { [Op.gte]: since } } }),
      JobDedupFingerprint.count({ where: { status: 'rejected', createdAt: { [Op.gte]: since } } }),
      JobIngestionQueue.count({ where: { status: 'pending' } }),
      JobIngestionQueue.findAll({
        where: { createdAt: { [Op.gte]: since } },
        order: [['createdAt', 'DESC']],
        limit: 20,
        attributes: ['id', 'status', 'reasonCode', 'title', 'companyName', 'locationText', 'createdAt'],
      }),
    ]);

    res.json({
      windowDays: 7,
      counts: {
        published,
        queued,
        rejected,
        pendingQueue,
      },
      recentQueue,
    });
  } catch (error) {
    console.error('❌ getAutomationReport error:', error);
    res.status(500).json({ error: 'Failed to load automation report' });
  }
};

exports.listFallbackQueue = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const offset = (page - 1) * limit;
    const status = req.query.status || 'pending';
    const search = (req.query.search || '').trim();

    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { companyName: { [Op.like]: `%${search}%` } },
        { locationText: { [Op.like]: `%${search}%` } },
        { sourceName: { [Op.like]: `%${search}%` } },
      ];
    }

    const { rows, count } = await JobIngestionQueue.findAndCountAll({
      where,
      include: [
        { model: Company, as: 'company', attributes: ['id', 'name'], required: false },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      items: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error('❌ listFallbackQueue error:', error);
    res.status(500).json({ error: 'Failed to load fallback queue' });
  }
};

exports.resolveQueueItem = async (req, res) => {
  try {
    const queueItem = await JobIngestionQueue.findByPk(req.params.id);
    if (!queueItem) {
      return res.status(404).json({ error: 'Queue item not found' });
    }
    if (queueItem.status !== 'pending') {
      return res.status(400).json({ error: 'Queue item is not pending' });
    }

    const companyId = Number(req.body?.companyId);
    if (!Number.isFinite(companyId) || companyId <= 0) {
      return res.status(400).json({ error: 'Valid companyId is required' });
    }

    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(400).json({ error: 'Company not found' });
    }

    const raw = normalizeRawJob({
      ...queueItem.payload,
      ...{
        title: queueItem.title,
        description: queueItem.description,
        type: queueItem.type,
        locationId: queueItem.locationId,
        locationText: queueItem.locationText,
        sourceUrl: queueItem.sourceUrl,
        sourceExternalId: queueItem.sourceExternalId,
        sourceType: queueItem.sourceType,
        sourceName: queueItem.sourceName,
        sourcePostedAt: queueItem.sourcePostedAt,
        crawlerFetchedAt: queueItem.crawlerFetchedAt,
        applicationUrl: queueItem.applicationUrl,
        companyName: queueItem.companyName,
        companyId,
      },
    });

    const validated = await validateAndResolve(raw);
    if (!validated.valid) {
      return res.status(400).json({ error: `Validation failed: ${validated.reasonCode}` });
    }

    const { resolved } = validated;
    const keys = buildKeys({
      sourceUrl: resolved.sourceUrl,
      sourceHost: resolved.sourceHost,
      sourceExternalId: resolved.sourceExternalId,
      title: resolved.title,
      companyId: resolved.company?.id,
      companyName: resolved.companyName,
      locationId: resolved.location?.id,
      type: resolved.type,
    });

    const duplicate = await isDuplicate(keys);
    if (duplicate.duplicate && duplicate.reasonCode !== 'DUPLICATE_PENDING_QUEUE') {
      return res.status(400).json({ error: `Duplicate detected: ${duplicate.reasonCode}` });
    }

    const job = await publishJob({ resolved, actorUserId: req.user.id });

    await queueItem.update({
      status: 'published',
      companyId: resolved.company.id,
      publishedJobId: job.id,
      reviewedBy: req.user.id,
      reviewNotes: req.body?.reviewNotes || null,
      resolvedAt: new Date(),
    });

    const existingQueuedFingerprint = await JobDedupFingerprint.findOne({ where: { queueId: queueItem.id } });
    if (existingQueuedFingerprint) {
      await existingQueuedFingerprint.update({
        status: 'published',
        jobId: job.id,
        companyId: resolved.company.id,
        locationId: resolved.location?.id || null,
      });
    } else {
      await saveFingerprint({
        keys,
        sourceType: resolved.sourceType,
        status: 'published',
        companyId: resolved.company.id,
        locationId: resolved.location?.id || null,
        jobId: job.id,
        queueId: queueItem.id,
        meta: { pipeline: 'automation', resolvedFromQueue: true },
      });
    }

    res.json({ message: 'Queue item published successfully', jobId: job.id });
  } catch (error) {
    console.error('❌ resolveQueueItem error:', error);
    res.status(500).json({ error: 'Failed to resolve queue item', details: error.message });
  }
};

exports.rejectQueueItem = async (req, res) => {
  try {
    const queueItem = await JobIngestionQueue.findByPk(req.params.id);
    if (!queueItem) {
      return res.status(404).json({ error: 'Queue item not found' });
    }

    await queueItem.update({
      status: 'rejected',
      reviewedBy: req.user.id,
      reviewNotes: req.body?.reviewNotes || null,
      resolvedAt: new Date(),
    });

    const existing = await JobDedupFingerprint.findOne({ where: { queueId: queueItem.id } });
    if (existing) {
      await existing.update({ status: 'rejected' });
    }

    res.json({ message: 'Queue item rejected' });
  } catch (error) {
    console.error('❌ rejectQueueItem error:', error);
    res.status(500).json({ error: 'Failed to reject queue item' });
  }
};
