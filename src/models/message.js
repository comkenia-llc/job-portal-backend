"use strict";
module.exports = (sequelize, DataTypes) => {
    const Message = sequelize.define(
        "Message",
        {
            conversation_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            sender_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            sender_role: {
                type: DataTypes.ENUM("admin", "employer", "candidate"),
                allowNull: false,
            },
            body: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            attachments: {
                type: DataTypes.JSON,
                allowNull: true,
            },
        },
        {
            tableName: "Messages",
        }
    );

    Message.associate = (models) => {
        Message.belongsTo(models.Conversation, { foreignKey: "conversation_id", as: "conversation" });
        Message.hasMany(models.MessageDelivery, { foreignKey: "message_id", as: "deliveries" });
        if (models.User) {
            Message.belongsTo(models.User, { foreignKey: "sender_id", as: "sender" });
        }
    };

    return Message;
};
