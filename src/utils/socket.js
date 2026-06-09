"use strict";

const jwt = require("jsonwebtoken");
const { ConversationParticipant, Message, MessageDelivery, Conversation, User } = require("../models");
const { Op } = require("sequelize");

const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = typeof decoded.id === "object" && decoded.id.id ? decoded.id.id : decoded.id;
        return { id: userId, role: decoded.role, companyId: decoded.companyId || null };
    } catch {
        return null;
    }
};

const getTokenFromHandshake = (socket) => {
    const cookieHeader = socket.handshake.headers.cookie || "";
    const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
    if (socket.handshake.auth && socket.handshake.auth.token) return socket.handshake.auth.token;
    return null;
};

async function userInConversation(userId, conversationId) {
    const count = await ConversationParticipant.count({
        where: { user_id: userId, conversation_id: conversationId },
    });
    return count > 0;
}

async function getParticipants(conversationId, excludeUserId) {
    const rows = await ConversationParticipant.findAll({
        where: {
            conversation_id: conversationId,
            user_id: excludeUserId ? { [Op.ne]: excludeUserId } : { [Op.ne]: null },
        },
    });
    return rows.map((r) => r.user_id);
}

function initSocket(io) {
    io.use((socket, next) => {
        const token = getTokenFromHandshake(socket);
        const user = verifyToken(token);
        if (!user) return next(new Error("Unauthorized"));
        socket.user = user;
        return next();
    });

    io.on("connection", (socket) => {
        const user = socket.user;
        socket.join(`user:${user.id}`);
        // refresh lastLogin on connect
        User.update({ lastLogin: new Date() }, { where: { id: user.id } }).catch(() => {});
        // broadcast simple presence
        const nowIso = new Date().toISOString();
        io.emit("presence:update", { userId: user.id, status: "online", lastSeen: null, at: nowIso });

        socket.on("joinConversation", async ({ conversationId }) => {
            if (!(await userInConversation(user.id, conversationId))) return;
            socket.join(`conv:${conversationId}`);
        });

        socket.on("sendMessage", async ({ conversationId, body }) => {
            if (!body || !(await userInConversation(user.id, conversationId))) return;
            try {
                const created = await Message.create({
                    conversation_id: conversationId,
                    sender_id: user.id,
                    sender_role: user.role,
                    body,
                });

                // deliveries
                const recipients = await getParticipants(conversationId, user.id);
                if (recipients.length) {
                    await MessageDelivery.bulkCreate(
                        recipients.map((rid) => ({
                            message_id: created.id,
                            recipient_id: rid,
                            delivered_at: new Date(),
                        }))
                    );
                }

                await Conversation.update({ last_message_at: new Date() }, { where: { id: conversationId } });

                // reload message with deliveries and sender
                const message = await Message.findByPk(created.id, {
                    include: [
                        { model: MessageDelivery, as: "deliveries" },
                        {
                            model: User,
                            as: "sender",
                            attributes: ["id", "username", "firstName", "lastName", "avatarUrl"],
                        },
                    ],
                });

                io.to(`user:${user.id}`).emit("message:ack", { conversationId, message });
                recipients.forEach((rid) => {
                    io.to(`user:${rid}`).emit("message:new", { conversationId, message });
                });
            } catch (err) {
                socket.emit("message:error", { error: "Failed to send message" });
            }
        });

        socket.on("markRead", async ({ messageId }) => {
            try {
                await MessageDelivery.update(
                    { read_at: new Date() },
                    { where: { message_id: messageId, recipient_id: user.id } }
                );
                const delivery = await MessageDelivery.findOne({ where: { message_id: messageId, recipient_id: user.id } });
                if (delivery) {
                    const msg = await Message.findByPk(messageId);
                    if (msg) {
                        io.to(`user:${msg.sender_id}`).emit("message:read", { conversationId: msg.conversation_id, messageId });
                    }
                }
            } catch {
                // ignore
            }
        });

        socket.on("typing", async ({ conversationId }) => {
            if (!(await userInConversation(user.id, conversationId))) return;
            const recipients = await getParticipants(conversationId, user.id);
            recipients.forEach((rid) => io.to(`user:${rid}`).emit("typing", { conversationId }));
        });

        socket.on("disconnect", () => {
            const lastSeen = new Date().toISOString();
            User.update({ lastLogin: lastSeen }, { where: { id: user.id } }).catch(() => {});
            io.emit("presence:update", { userId: user.id, status: "offline", lastSeen, at: lastSeen });
        });
    });
}

module.exports = { initSocket };
