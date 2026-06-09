"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("candidate_subscriptions", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: "Users", key: "id" },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            plan_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: "plans", key: "id" },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            start_date: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.fn("NOW"),
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
                defaultValue: "auto",
            },
            payment_method: {
                type: Sequelize.STRING,
            },
            payment_reference: {
                type: Sequelize.STRING,
            },
            stripe_customer_id: {
                type: Sequelize.STRING,
            },
            stripe_subscription_id: {
                type: Sequelize.STRING,
            },
            usage_snapshot: {
                type: Sequelize.JSON,
            },
            notes: {
                type: Sequelize.TEXT,
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn("NOW"),
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.fn("NOW"),
            },
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("candidate_subscriptions");
        await queryInterface.sequelize.query(
            "DROP TYPE IF EXISTS \"enum_candidate_subscriptions_status\";"
        );
        await queryInterface.sequelize.query(
            "DROP TYPE IF EXISTS \"enum_candidate_subscriptions_renewal_method\";"
        );
    },
};
