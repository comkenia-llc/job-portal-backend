'use strict';
module.exports = (sequelize, DataTypes) => {
  const Interview = sequelize.define('Interview', {
    applicationId: { type: DataTypes.INTEGER, allowNull: false },
    jobId: { type: DataTypes.INTEGER, allowNull: false },
    candidateId: { type: DataTypes.INTEGER, allowNull: false },
    createdBy: { type: DataTypes.INTEGER, allowNull: true },
    scheduledFor: { type: DataTypes.DATE, allowNull: false },
    status: {
      type: DataTypes.ENUM(
        'scheduled',
        'interviewed',
        'hired',
        'canceled',
        'rescheduled',
        'completed'
      ),
      defaultValue: 'scheduled',
    },
    type: { type: DataTypes.STRING }, // in-person / virtual / phone
    location: { type: DataTypes.STRING },
    meetingLink: { type: DataTypes.STRING },
    interviewerName: { type: DataTypes.STRING },
    timezone: { type: DataTypes.STRING },
    notes: { type: DataTypes.TEXT },
    rescheduleNote: { type: DataTypes.TEXT },
    calendarInviteUrl: { type: DataTypes.STRING },
  }, {
    tableName: 'Interviews',
  });

  return Interview;
};
