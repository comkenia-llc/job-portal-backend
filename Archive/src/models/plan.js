"use strict";
module.exports = (sequelize, DataTypes) => {
    const Plan = sequelize.define(
        "Plan",
        {
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            slug: {
                type: DataTypes.STRING,
                unique: true,
                allowNull: false,
            },
            audience: {
                type: DataTypes.ENUM("employer", "candidate"),
                allowNull: false,
                defaultValue: "employer",
            },
            price_monthly: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0.0,
            },
            price_yearly: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true,
            },
            currency: {
                type: DataTypes.STRING(10),
                defaultValue: "USD",
            },
            duration_type: {
                type: DataTypes.ENUM("monthly", "yearly", "lifetime"),
                defaultValue: "monthly",
            },
            features: {
                type: DataTypes.JSON,
                allowNull: false,
            },
            description: DataTypes.TEXT,
            ribbon_text: {
                type: DataTypes.STRING(120),
                allowNull: true,
            },
            ribbon_color: {
                type: DataTypes.STRING(30),
                allowNull: true,
            },
            ribbon_text_color: {
                type: DataTypes.STRING(30),
                allowNull: true,
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
        },
        {
            tableName: "plans",
        }
    );

    Plan.associate = (models) => {
        Plan.hasMany(models.Subscription, { foreignKey: "plan_id" });
    };

    return Plan;
};
