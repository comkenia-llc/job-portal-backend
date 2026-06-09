'use strict';

const { Op } = require('sequelize');
const { Job } = require('../../models');
const { slugifyValue } = require('./utils');

const generateUniqueSlug = async (seed) => {
  const base = slugifyValue(seed) || `job-${Date.now()}`;
  let slug = base;
  let i = 1;
  while (await Job.findOne({ where: { slug }, attributes: ['id'] })) {
    slug = `${base}-${i++}`;
  }
  return slug;
};

const publishJob = async ({ resolved, actorUserId }) => {
  if (!resolved.company?.id) {
    throw new Error('Cannot publish without resolved company');
  }
  if (!resolved.location?.id) {
    throw new Error('Cannot publish without resolved location');
  }

  const locationText =
    resolved.location.name ||
    [resolved.location.city, resolved.location.state, resolved.location.country].filter(Boolean).join(', ') ||
    'Unknown location';

  const slug = await generateUniqueSlug(
    `${resolved.title} ${resolved.company.name || resolved.companyName || ''} ${locationText}`
  );

  const job = await Job.create({
    title: resolved.title,
    market: resolved.market || resolved.company.market || 'dubai',
    slug,
    description: resolved.description,
    type: resolved.type,
    location: locationText,
    remote: resolved.type === 'remote',
    salaryMin: resolved.salaryMin,
    salaryMax: resolved.salaryMax,
    currency: resolved.currency || 'USD',
    status: 'open',
    industry: resolved.industry || resolved.company.industry || null,
    skills: resolved.skills,
    applicationUrl: resolved.applicationUrl,
    deadline: resolved.deadline,
    postedBy: actorUserId,
    companyId: resolved.company.id,
    locationId: resolved.location.id,
  });

  return job;
};

module.exports = {
  publishJob,
};
