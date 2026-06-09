"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("company_subscriptions", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      company_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      plan_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      end_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM("active", "expired", "canceled", "pending"),
        defaultValue: "active",
      },
      renewal_method: {
        type: Sequelize.ENUM("manual", "auto"),
        defaultValue: "manual",
      },
      payment_method: {
        type: Sequelize.STRING(50),
        allowNull: true, // e.g. "Stripe", "KeekanPay"
      },
      payment_reference: {
        type: Sequelize.STRING(100),
        allowNull: true, // transaction id or reference
      },
      usage_snapshot: {
        type: Sequelize.JSON,
        allowNull: true, // cached usage limits (e.g., jobs posted count)
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true, // admin comments
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ),
      },
    });

    // Optional: Add foreign keys (if Company/Plan models exist)
    // await queryInterface.addConstraint("company_subscriptions", {
    //   fields: ["company_id"],
    //   type: "foreign key",
    //   name: "fk_company_subscriptions_company",
    //   references: {
    //     table: "companies",
    //     field: "id",
    //   },
    //   onDelete: "CASCADE",
    // });

    // await queryInterface.addConstraint("company_subscriptions", {
    //   fields: ["plan_id"],
    //   type: "foreign key",
    //   name: "fk_company_subscriptions_plan",
    //   references: {
    //     table: "plans",
    //     field: "id",
    //   },
    //   onDelete: "CASCADE",
    // });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("company_subscriptions");
  },
};
