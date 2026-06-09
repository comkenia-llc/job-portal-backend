'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('CandidateProfiles', 'firstName', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: ''
    });
    await queryInterface.addColumn('CandidateProfiles', 'lastName', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: ''
    });
    await queryInterface.addColumn('CandidateProfiles', 'phone', {
      type: Sequelize.STRING
    });
    await queryInterface.addColumn('CandidateProfiles', 'email', {
      type: Sequelize.STRING
    });
    await queryInterface.addColumn('CandidateProfiles', 'dateOfBirth', {
      type: Sequelize.DATE
    });
    await queryInterface.addColumn('CandidateProfiles', 'gender', {
      type: Sequelize.ENUM('male', 'female', 'other')
    });
    await queryInterface.addColumn('CandidateProfiles', 'nationality', {
      type: Sequelize.STRING
    });

    // structured resume data
    await queryInterface.addColumn('CandidateProfiles', 'workHistory', {
      type: Sequelize.JSON
    });
    await queryInterface.addColumn('CandidateProfiles', 'educationHistory', {
      type: Sequelize.JSON
    });
    await queryInterface.addColumn('CandidateProfiles', 'certifications', {
      type: Sequelize.JSON
    });
    await queryInterface.addColumn('CandidateProfiles', 'languages', {
      type: Sequelize.JSON
    });

    // preferences
    await queryInterface.addColumn('CandidateProfiles', 'preferredJobType', {
      type: Sequelize.ENUM('full-time', 'part-time', 'contract', 'internship', 'remote')
    });
    await queryInterface.addColumn('CandidateProfiles', 'expectedSalaryMin', {
      type: Sequelize.INTEGER
    });
    await queryInterface.addColumn('CandidateProfiles', 'expectedSalaryMax', {
      type: Sequelize.INTEGER
    });
    await queryInterface.addColumn('CandidateProfiles', 'currency', {
      type: Sequelize.STRING,
      defaultValue: 'USD'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('CandidateProfiles', 'firstName');
    await queryInterface.removeColumn('CandidateProfiles', 'lastName');
    await queryInterface.removeColumn('CandidateProfiles', 'phone');
    await queryInterface.removeColumn('CandidateProfiles', 'email');
    await queryInterface.removeColumn('CandidateProfiles', 'dateOfBirth');
    await queryInterface.removeColumn('CandidateProfiles', 'gender');
    await queryInterface.removeColumn('CandidateProfiles', 'nationality');
    await queryInterface.removeColumn('CandidateProfiles', 'workHistory');
    await queryInterface.removeColumn('CandidateProfiles', 'educationHistory');
    await queryInterface.removeColumn('CandidateProfiles', 'certifications');
    await queryInterface.removeColumn('CandidateProfiles', 'languages');
    await queryInterface.removeColumn('CandidateProfiles', 'preferredJobType');
    await queryInterface.removeColumn('CandidateProfiles', 'expectedSalaryMin');
    await queryInterface.removeColumn('CandidateProfiles', 'expectedSalaryMax');
    await queryInterface.removeColumn('CandidateProfiles', 'currency');
  }
};
