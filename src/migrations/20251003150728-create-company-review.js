'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('CompanyReviews', {
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
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE'
      },

      ratingOverall: { type: Sequelize.INTEGER, allowNull: false },
      ratingWorkLifeBalance: { type: Sequelize.INTEGER },
      ratingCulture: { type: Sequelize.INTEGER },
      ratingManagement: { type: Sequelize.INTEGER },

      title: { type: Sequelize.STRING },
      pros: { type: Sequelize.TEXT },
      cons: { type: Sequelize.TEXT },
      adviceToManagement: { type: Sequelize.TEXT },

      recommendToFriend: { type: Sequelize.BOOLEAN, defaultValue: false },
      employmentStatus: {
        type: Sequelize.ENUM('current', 'former'),
        allowNull: false,
        defaultValue: 'current'
      },
      jobTitle: { type: Sequelize.STRING },
      location: { type: Sequelize.STRING },

      reviewDate: { type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },

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
    await queryInterface.dropTable('CompanyReviews');
  }
};
