"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        // Conversations
        await queryInterface.createTable("Conversations", {
            id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
            subject: { type: Sequelize.STRING, allowNull: true },
            created_by: { type: Sequelize.INTEGER, allowNull: false },
            created_by_role: { type: Sequelize.ENUM("admin", "employer", "candidate"), allowNull: false },
            last_message_at: { type: Sequelize.DATE, allowNull: true },
            createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
            updatedAt: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
            },
        });

        // Participants
        await queryInterface.createTable("ConversationParticipants", {
            id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
            conversation_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: "Conversations", key: "id" },
                onDelete: "CASCADE",
            },
            user_id: { type: Sequelize.INTEGER, allowNull: false },
            role: { type: Sequelize.ENUM("admin", "employer", "candidate"), allowNull: false },
            is_muted: { type: Sequelize.BOOLEAN, defaultValue: false },
            last_read_at: { type: Sequelize.DATE, allowNull: true },
            createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
            updatedAt: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
            },
        });
        await queryInterface.addIndex("ConversationParticipants", ["conversation_id", "user_id"], {
            unique: true,
            name: "conv_participant_unique",
        });

        // Messages
        await queryInterface.createTable("Messages", {
            id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
            conversation_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: "Conversations", key: "id" },
                onDelete: "CASCADE",
            },
            sender_id: { type: Sequelize.INTEGER, allowNull: false },
            sender_role: { type: Sequelize.ENUM("admin", "employer", "candidate"), allowNull: false },
            body: { type: Sequelize.TEXT, allowNull: false },
            attachments: { type: Sequelize.JSON, allowNull: true },
            createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
            updatedAt: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
            },
        });
        await queryInterface.addIndex("Messages", ["conversation_id", "createdAt"]);

        // Deliveries (for delivered/read ticks)
        await queryInterface.createTable("MessageDeliveries", {
            id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
            message_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: "Messages", key: "id" },
                onDelete: "CASCADE",
            },
            recipient_id: { type: Sequelize.INTEGER, allowNull: false },
            delivered_at: { type: Sequelize.DATE, allowNull: true },
            read_at: { type: Sequelize.DATE, allowNull: true },
            createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
            updatedAt: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
            },
        });
        await queryInterface.addIndex("MessageDeliveries", ["message_id", "recipient_id"], {
            unique: true,
            name: "message_delivery_unique",
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable("MessageDeliveries");
        await queryInterface.dropTable("Messages");
        await queryInterface.dropTable("ConversationParticipants");
        await queryInterface.dropTable("Conversations");
    },
};
