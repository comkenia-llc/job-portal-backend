"use strict";
module.exports = (sequelize, DataTypes) => {
    const CompanySubscription = sequelize.define(
        "CompanySubscription",
        {
            company_id: {
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
                defaultValue: "manual",
            },
            payment_method: DataTypes.STRING,
            payment_reference: DataTypes.STRING,
            stripe_customer_id: DataTypes.STRING,
            stripe_subscription_id: DataTypes.STRING,
            usage_snapshot: DataTypes.JSON,
            notes: DataTypes.TEXT,
        },
        {
            tableName: "company_subscriptions",
        }
    );

    

    return CompanySubscription;
};
