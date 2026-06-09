"use strict";
module.exports = (sequelize, DataTypes) => {
    const ConversationParticipant = sequelize.define(
        "ConversationParticipant",
        {
            conversation_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            user_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            role: {
                type: DataTypes.ENUM("admin", "employer", "candidate"),
                allowNull: false,
            },
            is_muted: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            last_read_at: DataTypes.DATE,
        },
        {
            tableName: "ConversationParticipants",
        }
    );

    ConversationParticipant.associate = (models) => {
        ConversationParticipant.belongsTo(models.Conversation, { foreignKey: "conversation_id", as: "conversation" });
    };

    return ConversationParticipant;
};
