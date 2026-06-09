"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      UPDATE Companies SET createdBy = 1 WHERE createdBy IS NULL;
    `);
  },

  async down() {
    // Optional: revert the change if needed
  },
};
