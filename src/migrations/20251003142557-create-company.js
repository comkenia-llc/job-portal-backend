'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Companies', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false   // 👈 required
      },
      legalName: {
        type: Sequelize.STRING
      },
      industry: {
        type: Sequelize.STRING
      },
      size: {
        type: Sequelize.STRING  // later we can make ENUM: ['1-10','11-50','51-200','200+']
      },
      logoUrl: {
        type: Sequelize.STRING
      },
      bannerUrl: {
        type: Sequelize.STRING
      },
      tagline: {
        type: Sequelize.STRING
      },
      about: {
        type: Sequelize.TEXT
      },
      website: {
        type: Sequelize.STRING
      },
      email: {
        type: Sequelize.STRING,
        validate: {
          isEmail: true
        }
      },
      phone: {
        type: Sequelize.STRING
      },
      headquarters: {
        type: Sequelize.STRING
      },
      locations: {
        type: Sequelize.TEXT   // can store JSON string of multiple branches
      },
      linkedinUrl: {
        type: Sequelize.STRING
      },
      facebookUrl: {
        type: Sequelize.STRING
      },
      twitterUrl: {
        type: Sequelize.STRING
      },
      glassdoorUrl: {
        type: Sequelize.STRING
      },
      foundedYear: {
        type: Sequelize.INTEGER
      },
      verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false    // 👈 default
      },
      status: {
        type: Sequelize.ENUM('active', 'suspended', 'pending'),
        defaultValue: 'active' // 👈 safer than plain string
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
    await queryInterface.dropTable('Companies');
  }
};
