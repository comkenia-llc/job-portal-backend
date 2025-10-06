'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // remove old columns if no longer needed
    await queryInterface.removeColumn('Jobs', 'company');
    await queryInterface.removeColumn('Jobs', 'salary');

    // add new fields
    await queryInterface.addColumn('Jobs', 'type', {
      type: Sequelize.ENUM('full-time', 'part-time', 'contract', 'internship', 'temporary', 'remote'),
      allowNull: false,
      defaultValue: 'full-time'
    });

    await queryInterface.addColumn('Jobs', 'remote', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });

    await queryInterface.addColumn('Jobs', 'salaryMin', {
      type: Sequelize.INTEGER
    });

    await queryInterface.addColumn('Jobs', 'salaryMax', {
      type: Sequelize.INTEGER
    });

    await queryInterface.addColumn('Jobs', 'currency', {
      type: Sequelize.STRING,
      defaultValue: 'USD'
    });

    await queryInterface.addColumn('Jobs', 'status', {
      type: Sequelize.ENUM('open', 'closed', 'draft'),
      defaultValue: 'open'
    });

    await queryInterface.addColumn('Jobs', 'experienceLevel', {
      type: Sequelize.ENUM('entry', 'junior', 'mid', 'senior', 'lead', 'executive')
    });

    await queryInterface.addColumn('Jobs', 'educationLevel', {
      type: Sequelize.ENUM('none', 'highschool', 'bachelor', 'master', 'phd', 'other')
    });

    await queryInterface.addColumn('Jobs', 'industry', {
      type: Sequelize.STRING
    });

    await queryInterface.addColumn('Jobs', 'skills', {
      type: Sequelize.TEXT
    });

    await queryInterface.addColumn('Jobs', 'applicationUrl', {
      type: Sequelize.STRING
    });

    await queryInterface.addColumn('Jobs', 'deadline', {
      type: Sequelize.DATE
    });

    await queryInterface.addColumn('Jobs', 'views', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });

    await queryInterface.addColumn('Jobs', 'postedBy', {
      type: Sequelize.INTEGER,
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE'
    });

    await queryInterface.addColumn('Jobs', 'companyId', {
      type: Sequelize.INTEGER,
      references: { model: 'Companies', key: 'id' },
      onDelete: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    // reverse: drop new columns
    await queryInterface.removeColumn('Jobs', 'type');
    await queryInterface.removeColumn('Jobs', 'remote');
    await queryInterface.removeColumn('Jobs', 'salaryMin');
    await queryInterface.removeColumn('Jobs', 'salaryMax');
    await queryInterface.removeColumn('Jobs', 'currency');
    await queryInterface.removeColumn('Jobs', 'status');
    await queryInterface.removeColumn('Jobs', 'experienceLevel');
    await queryInterface.removeColumn('Jobs', 'educationLevel');
    await queryInterface.removeColumn('Jobs', 'industry');
    await queryInterface.removeColumn('Jobs', 'skills');
    await queryInterface.removeColumn('Jobs', 'applicationUrl');
    await queryInterface.removeColumn('Jobs', 'deadline');
    await queryInterface.removeColumn('Jobs', 'views');
    await queryInterface.removeColumn('Jobs', 'postedBy');
    await queryInterface.removeColumn('Jobs', 'companyId');

    // restore old columns (to revert properly)
    await queryInterface.addColumn('Jobs', 'company', {
      type: Sequelize.STRING
    });
    await queryInterface.addColumn('Jobs', 'salary', {
      type: Sequelize.INTEGER
    });
  }
};
