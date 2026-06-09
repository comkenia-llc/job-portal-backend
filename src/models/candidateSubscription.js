"use strict";
module.exports = (sequelize, DataTypes) => {
    const CandidateSubscription = sequelize.define(
        "CandidateSubscription",
        {
            user_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            plan_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            start_date: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            end_date: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            status: {
                type: DataTypes.ENUM("active", "expired", "canceled", "pending"),
                defaultValue: "active",
            },
            renewal_method: {
                type: DataTypes.ENUM("manual", "auto"),
                defaultValue: "auto",
            },
            payment_method: DataTypes.STRING,
            payment_reference: DataTypes.STRING,
            stripe_customer_id: DataTypes.STRING,
            stripe_subscription_id: DataTypes.STRING,
            usage_snapshot: DataTypes.JSON,
            notes: DataTypes.TEXT,
        },
        {
            tableName: "candidate_subscriptions",
        }
    );

    return CandidateSubscription;
};
