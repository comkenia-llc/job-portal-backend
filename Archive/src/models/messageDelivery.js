"use strict";
module.exports = (sequelize, DataTypes) => {
    const MessageDelivery = sequelize.define(
        "MessageDelivery",
        {
            message_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            recipient_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            delivered_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            read_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
        },
        {
            tableName: "MessageDeliveries",
        }
    );

    MessageDelivery.associate = (models) => {
        MessageDelivery.belongsTo(models.Message, { foreignKey: "message_id", as: "message" });
    };

    return MessageDelivery;
};
