"use strict";
module.exports = (sequelize, DataTypes) => {
    const Feature = sequelize.define(
        "Feature",
        {
            key: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            market: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "global",
            },
            audience: {
                type: DataTypes.ENUM("employer", "candidate"),
                allowNull: false,
                defaultValue: "employer",
            },
            label: {
                type: DataTypes.STRING(150),
                allowNull: false,
            },
            type: {
                type: DataTypes.ENUM("number", "boolean", "string"),
                allowNull: false,
                defaultValue: "boolean",
            },
            input_type: {
                type: DataTypes.ENUM("number", "toggle", "select", "text"),
                allowNull: false,
                defaultValue: "number",
            },
            default_value: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            options: {
                type: DataTypes.JSON, // e.g. ["basic", "full"]
                allowNull: true,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
        },
        {
            tableName: "features",
            indexes: [
                {
                    unique: true,
                    fields: ["key", "market"],
                    name: "features_key_market_unique_idx",
                },
            ],
        }
    );

    Feature.associate = (models) => {
        // (Optional) link to plan-feature mapping if needed later
        // Feature.belongsToMany(models.Plan, { through: "plan_features" });
    };

    return Feature;
};
