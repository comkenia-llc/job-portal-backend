'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('CandidateProfiles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users', // 👈 FK to Users table
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      headline: { type: Sequelize.STRING },
      bio: { type: Sequelize.TEXT },
      skills: { type: Sequelize.TEXT },
      experienceYears: { type: Sequelize.INTEGER },
      education: { type: Sequelize.TEXT },
      resumeUrl: { type: Sequelize.STRING },
      linkedinUrl: { type: Sequelize.STRING },
      portfolioUrl: { type: Sequelize.STRING },
      location: { type: Sequelize.STRING },
      isAvailable: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('CandidateProfiles');
  }
};
