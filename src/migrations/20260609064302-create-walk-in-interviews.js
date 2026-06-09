"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("WalkInInterviews", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      title: { type: Sequelize.STRING, allowNull: false },
      slug: { type: Sequelize.STRING, allowNull: false, unique: true },

      companyId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      locationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Locations", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },

      interviewStartDate: { type: Sequelize.DATE, allowNull: false },
      interviewEndDate: { type: Sequelize.DATE, allowNull: true },
      interviewTime: { type: Sequelize.STRING, allowNull: true },

      venueDetails: { type: Sequelize.TEXT, allowNull: true },
      mapUrl: { type: Sequelize.STRING, allowNull: true },

      contactEmail: { type: Sequelize.STRING, allowNull: true },
      contactPhone: { type: Sequelize.STRING, allowNull: true },
      whatsapp: { type: Sequelize.STRING, allowNull: true },

      requirements: { type: Sequelize.TEXT, allowNull: true },
      documentsRequired: { type: Sequelize.TEXT, allowNull: true },
      instructions: { type: Sequelize.TEXT, allowNull: true },

      status: {
        type: Sequelize.ENUM("open", "closed", "draft", "expired"),
        allowNull: false,
        defaultValue: "open",
      },

      isFeatured: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      views: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      seoTitle: { type: Sequelize.STRING, allowNull: true },
      seoDescription: { type: Sequelize.TEXT, allowNull: true },
      seoKeywords: { type: Sequelize.TEXT, allowNull: true },

      createdBy: { type: Sequelize.INTEGER, allowNull: true },

      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex("WalkInInterviews", ["status", "interviewStartDate"], {
      name: "walkin_status_start_date_idx",
    });

    await queryInterface.addIndex("WalkInInterviews", ["companyId"], {
      name: "walkin_company_idx",
    });

    await queryInterface.addIndex("WalkInInterviews", ["locationId"], {
      name: "walkin_location_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("WalkInInterviews");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_WalkInInterviews_status";').catch(() => { });
  },
};