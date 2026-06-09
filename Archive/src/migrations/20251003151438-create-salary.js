'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Salaries', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      companyId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Companies', key: 'id' },
        onDelete: 'CASCADE'
      },
      userId: {
        type: Sequelize.INTEGER,
        references: { model: 'Users', key: 'id' },
        onDelete: 'SET NULL'
      },
      jobTitle: { type: Sequelize.STRING, allowNull: false },
      salaryMin: { type: Sequelize.INTEGER, allowNull: false },
      salaryMax: { type: Sequelize.INTEGER, allowNull: false },
      currency: { type: Sequelize.STRING, defaultValue: 'USD' },
      frequency: {
        type: Sequelize.ENUM('monthly', 'yearly', 'hourly'),
        defaultValue: 'monthly'
      },
      location: { type: Sequelize.STRING },
      experienceLevel: {
        type: Sequelize.ENUM('entry', 'mid', 'senior', 'lead'),
        defaultValue: 'entry'
      },
      employmentType: {
        type: Sequelize.ENUM('full-time', 'part-time', 'contract', 'internship'),
        defaultValue: 'full-time'
      },
      submittedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
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
    await queryInterface.dropTable('Salaries');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Salaries_frequency";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Salaries_experienceLevel";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Salaries_employmentType";');
  }
};
