'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Jobs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('full-time', 'part-time', 'contract', 'internship', 'temporary', 'remote'),
        allowNull: false
      },
      location: {
        type: Sequelize.STRING,
        allowNull: false
      },
      remote: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      salaryMin: {
        type: Sequelize.INTEGER
      },
      salaryMax: {
        type: Sequelize.INTEGER
      },
      currency: {
        type: Sequelize.STRING,
        defaultValue: 'USD'
      },
      status: {
        type: Sequelize.ENUM('open', 'closed', 'draft'),
        defaultValue: 'open'
      },
      experienceLevel: {
        type: Sequelize.ENUM('entry', 'junior', 'mid', 'senior', 'lead', 'executive')
      },
      educationLevel: {
        type: Sequelize.ENUM('none', 'highschool', 'bachelor', 'master', 'phd', 'other')
      },
      industry: {
        type: Sequelize.STRING
      },
      skills: {
        type: Sequelize.TEXT
      },
      applicationUrl: {
        type: Sequelize.STRING
      },
      deadline: {
        type: Sequelize.DATE
      },
      views: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      postedBy: {
        type: Sequelize.INTEGER,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE'
      },
      companyId: {
        type: Sequelize.INTEGER,
        references: { model: 'Companies', key: 'id' },
        onDelete: 'CASCADE'
      },
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
    await queryInterface.dropTable('Jobs');
  }
};
