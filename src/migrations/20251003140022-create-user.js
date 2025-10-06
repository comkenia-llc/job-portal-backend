'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      passwordHash: {
        type: Sequelize.STRING,
        allowNull: false
      },
      role: {
        type: Sequelize.ENUM('candidate', 'employer', 'admin'),
        allowNull: false,
        defaultValue: 'candidate'
      },
      avatarUrl: Sequelize.STRING,
      status: {
        type: Sequelize.ENUM('active', 'suspended', 'pending'),
        defaultValue: 'active'
      },
      emailVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      lastLogin: Sequelize.DATE,
      googleId: Sequelize.STRING,
      facebookId: Sequelize.STRING,
      linkedinId: Sequelize.STRING,
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
    await queryInterface.dropTable('Users');
  }
};
