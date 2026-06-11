"use strict";

const TABLE = "Locations";

const COLUMNS = {
  heroSummary: {
    type: "TEXT_LONG",
    allowNull: true,
  },
  hiringTrends: {
    type: "TEXT_LONG",
    allowNull: true,
  },
  employerLandscape: {
    type: "TEXT_LONG",
    allowNull: true,
  },
  salaryCostNarrative: {
    type: "TEXT_LONG",
    allowNull: true,
  },
  relocationNotes: {
    type: "TEXT_LONG",
    allowNull: true,
  },
  comparisonNotes: {
    type: "TEXT_LONG",
    allowNull: true,
  },
  featuredFacts: {
    type: "JSON",
    allowNull: true,
  },
  chartAnnotations: {
    type: "JSON",
    allowNull: true,
  },
};

const getColumnType = (Sequelize, def) => {
  if (def.type === "TEXT_LONG") return Sequelize.TEXT("long");
  if (def.type === "JSON") return Sequelize.JSON;
  return def.type;
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable(TABLE);

    for (const [columnName, def] of Object.entries(COLUMNS)) {
      if (!table[columnName]) {
        await queryInterface.addColumn(TABLE, columnName, {
          type: getColumnType(Sequelize, def),
          allowNull: def.allowNull,
        });
      }
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable(TABLE);

    for (const column of Object.keys(COLUMNS)) {
      if (table[column]) {
        await queryInterface.removeColumn(TABLE, column);
      }
    }
  },
};
