"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("features", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      key: {
        type: Sequelize.STRING(100),
        unique: true,
        allowNull: false,
      },
      label: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM("number", "boolean", "string"),
        allowNull: false,
        defaultValue: "boolean",
      },
      input_type: {
        type: Sequelize.ENUM("number", "toggle", "select", "text"),
        allowNull: false,
        defaultValue: "number",
      },
      default_value: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      options: {
        type: Sequelize.JSON, // for select inputs (e.g. ["basic","full"])
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("features");
  },
};
