'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'emailVerificationCodeHash', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Users', 'emailVerificationCodeExpiresAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Users', 'emailVerificationCodeExpiresAt');
    await queryInterface.removeColumn('Users', 'emailVerificationCodeHash');
  },
};
