"use strict";

module.exports = (sequelize, DataTypes) => {
    const Location = sequelize.define(
        "Location",
        {
            name: { type: DataTypes.STRING, allowNull: false },
            type: {
                type: DataTypes.ENUM(
                    "country",
                    "state",
                    "city",
                    "neighborhood",
                    "area",
                    "street"
                ),
                allowNull: false,
            },
            parentId: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: { model: "Locations", key: "id" },
                onDelete: "CASCADE",
            },
            latitude: DataTypes.DECIMAL(10, 7),
            longitude: DataTypes.DECIMAL(10, 7),
        },
        { tableName: "Locations" }
    );

    return Location;
};
