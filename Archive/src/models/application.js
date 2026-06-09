'use strict';
module.exports = (sequelize, DataTypes) => {
  const Application = sequelize.define('Application', {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    jobId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // ✅ Link specific resume (for multi-resume users)
    resumeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // 🧭 Tracking where user came from
    source: {
      type: DataTypes.STRING,
      allowNull: true, // e.g. "LinkedIn", "Direct", "Referral", "Organic"
    },

    // 💬 Optional message to employer
    coverLetter: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // 📎 Attachments (PDF resume, portfolio files)
    attachments: {
      type: DataTypes.JSON,
      allowNull: true, // store file paths
    },

    // 🏷️ Status workflow
    status: {
      type: DataTypes.ENUM(
        'pending',      // applied, not yet reviewed
        'reviewed',     // seen by employer
        'interview',    // invited for interview
        'offered',      // got job offer
        'hired',        // accepted
        'rejected'      // not selected
      ),
      defaultValue: 'pending',
    },

    appliedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    viewedAt: DataTypes.DATE,
    stageUpdatedAt: DataTypes.DATE,

    // 🔙 User withdrew manually
    isWithdrawn: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    // 🧾 Employer notes or remarks
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // 🕒 status history timeline
    statusHistory: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    // 📡 Tracking & Analytics
    trackingId: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // 🧭 Country / IP for analytics
    applicantIp: {
      type: DataTypes.STRING,
      allowNull: true,
    },

  }, {
    tableName: 'Applications',
  });

  return Application;
};
