"use strict";
module.exports = (sequelize, DataTypes) => {
    const Conversation = sequelize.define(
        "Conversation",
        {
            subject: DataTypes.STRING,
            created_by: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            created_by_role: {
                type: DataTypes.ENUM("admin", "employer", "candidate"),
                allowNull: false,
            },
            last_message_at: DataTypes.DATE,
        },
        {
            tableName: "Conversations",
        }
    );

    Conversation.associate = (models) => {
        Conversation.hasMany(models.ConversationParticipant, { foreignKey: "conversation_id", as: "participants" });
        Conversation.hasMany(models.Message, { foreignKey: "conversation_id", as: "messages" });
    };

    return Conversation;
};
