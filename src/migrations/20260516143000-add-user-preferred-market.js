'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'preferredMarket', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addIndex('Users', ['preferredMarket'], {
      name: 'users_preferred_market_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('Users', 'users_preferred_market_idx');
    await queryInterface.removeColumn('Users', 'preferredMarket');
  },
};
