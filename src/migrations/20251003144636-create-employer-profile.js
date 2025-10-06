'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('EmployerProfiles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE'
      },
      companyId: {
        type: Sequelize.INTEGER,
        references: { model: 'Companies', key: 'id' },
        onDelete: 'SET NULL'
      },
      jobTitle: { type: Sequelize.STRING },
      department: { type: Sequelize.STRING },
      phone: { type: Sequelize.STRING },
      email: { type: Sequelize.STRING },
      avatarUrl: { type: Sequelize.STRING },
      linkedinUrl: { type: Sequelize.STRING },
      bio: { type: Sequelize.TEXT },
      status: {
        type: Sequelize.ENUM('active', 'suspended', 'pending'),
        defaultValue: 'active'
      },
      verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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
    await queryInterface.dropTable('EmployerProfiles');
  }
};
