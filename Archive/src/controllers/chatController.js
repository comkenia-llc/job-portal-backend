"use strict";
const { Conversation, ConversationParticipant, Message, MessageDelivery, User, Company, Plan, CompanySubscription, CandidateSubscription } = require("../models");
const { Op } = require("sequelize");

// Basic role-allow rules
const canStartWith = (userRole, targetRole) => {
    if (userRole === "admin") return true;
    if (userRole === "employer" && (targetRole === "candidate" || targetRole === "employer")) return true;
    if (userRole === "candidate" && (targetRole === "employer" || targetRole === "candidate")) return true;
    return false;
};

// Fetch user's active plan features (simplified)
const getPlanFeatures = async (user) => {
    try {
        if (user.role === "employer" && user.company_id) {
            const sub = await CompanySubscription.findOne({
                where: {
                    company_id: user.company_id,
                    status: "active",
                    end_date: { [Op.or]: [{ [Op.gt]: new Date() }, { [Op.is]: null }] },
                },
                include: [{ model: Plan, attributes: ["features"] }],
            });
            return sub?.Plan?.features || {};
        }
        if (user.role === "candidate") {
            const sub = await CandidateSubscription.findOne({
                where: {
                    user_id: user.id,
                    status: "active",
                    end_date: { [Op.or]: [{ [Op.gt]: new Date() }, { [Op.is]: null }] },
                },
                include: [{ model: Plan, attributes: ["features"] }],
            });
            return sub?.Plan?.features || {};
        }
        return {};
    } catch (err) {
        console.warn("⚠️ plan fetch failed", err);
        return {};
    }
};

const canSendMessage = async (user) => {
    const features = await getPlanFeatures(user);
    const canMessage = features?.can_message_candidates === true || features?.can_message_candidates === "true";
    if (!canMessage) return false;
    const maxMessages = Number(features?.max_messages_day || 0);
    if (!maxMessages) return false;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const count = await Message.count({
        where: { sender_id: user.id, createdAt: { [Op.gt]: since } },
    });
    return count < maxMessages;
};

exports.listConversations = async (req, res) => {
    try {
        const userId = req.user.id;
        const participantRows = await ConversationParticipant.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: Conversation,
                    as: "conversation",
                    include: [
                        {
                            model: ConversationParticipant,
                            as: "participants",
                            include: [
                                {
                                    model: User,
                                    as: "user",
                                    attributes: ["id", "username", "firstName", "lastName", "role", "avatarUrl", "lastLogin", "updatedAt"],
                                    include: [
                                        {
                                            model: Company,
                                            as: "Company",
                                            attributes: ["name"],
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            model: Message,
                            as: "messages",
                            order: [["createdAt", "DESC"]],
                            limit: 1,
                            include: [{ model: MessageDelivery, as: "deliveries" }],
                        },
                    ],
                },
            ],
        });

        const conversationIds = participantRows.map((row) => row.conversation?.id).filter(Boolean);
        let unreadByConversation = {};
        if (conversationIds.length) {
            const unreadRows = await MessageDelivery.findAll({
                attributes: ["message_id", "recipient_id"],
                where: {
                    recipient_id: userId,
                    read_at: { [Op.is]: null },
                },
                include: [
                    {
                        model: Message,
                        as: "message",
                        attributes: ["conversation_id"],
                        where: { conversation_id: conversationIds },
                    },
                ],
            });
            unreadRows.forEach((row) => {
                const convId = row.message.conversation_id;
                unreadByConversation[convId] = (unreadByConversation[convId] || 0) + 1;
            });
        }

        const conversations = participantRows
            .map((row) => row.conversation)
            .filter(Boolean)
            .map((conv) => {
                const lastMessage = conv.messages?.[0] || null;
                return {
                    id: conv.id,
                    subject: conv.subject,
                    last_message_at: conv.last_message_at,
                    unread: unreadByConversation[conv.id] || 0,
                    participants: conv.participants?.map((p) => ({
                        user_id: p.user_id,
                        role: p.role,
                        username: p.user?.username,
                        firstName: p.user?.firstName,
                        lastName: p.user?.lastName,
                        avatarUrl: p.user?.avatarUrl,
                        lastLogin: p.user?.lastLogin,
                        updatedAt: p.user?.updatedAt,
                        companyName: p.user?.Company?.name || p.user?.company?.name || null,
                    })),
                    last_message: lastMessage
                        ? {
                              id: lastMessage.id,
                              body: lastMessage.body,
                              sender_id: lastMessage.sender_id,
                              createdAt: lastMessage.createdAt,
                              deliveries: lastMessage.deliveries || [],
                          }
                        : null,
                };
            });
        res.json({ conversations });
    } catch (err) {
        console.error("❌ listConversations error", err);
        res.status(500).json({ message: "Failed to fetch conversations" });
    }
};

exports.searchPeople = async (req, res) => {
    try {
        const term = (req.query.q || "").trim();
        if (!term) return res.json({ items: [] });
        const like = { [Op.like]: `%${term}%` };
        const users = await User.findAll({
            where: {
                role: { [Op.in]: ["candidate", "employer"] },
                [Op.or]: [
                    { username: like },
                    { firstName: like },
                    { lastName: like },
                    { "$Company.name$": like },
                ],
            },
            include: [
                {
                    model: Company,
                    as: "Company",
                    attributes: ["name"],
                    required: false,
                },
            ],
            attributes: ["id", "username", "firstName", "lastName", "role", "avatarUrl", "lastLogin", "updatedAt"],
            limit: 20,
        });
        const items = users.map((u) => ({
            id: u.id,
            username: u.username,
            firstName: u.firstName,
            lastName: u.lastName,
            role: u.role,
            avatarUrl: u.avatarUrl,
            companyName: u.Company?.name || null,
        }));
        res.json({ items });
    } catch (err) {
        console.error("❌ searchPeople error", err);
        res.status(500).json({ message: "Search failed" });
    }
};

exports.createConversation = async (req, res) => {
    try {
        const { participantIds = [], subject = null } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        if (!Array.isArray(participantIds) || participantIds.length === 0) {
            return res.status(400).json({ message: "participantIds required" });
        }

        const users = await User.findAll({ where: { id: participantIds } });
        if (users.length !== participantIds.length) {
            return res.status(400).json({ message: "Invalid participants" });
        }

        for (const u of users) {
            if (!canStartWith(userRole, u.role)) {
                return res.status(403).json({ message: `Not allowed to start chat with ${u.role}` });
            }
        }

        // Try to reuse an existing conversation with exactly this participant set
        const targetIds = users.map((u) => u.id);
        const desiredSet = new Set([userId, ...targetIds]);
        const myConvRows = await ConversationParticipant.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: Conversation,
                    as: "conversation",
                    include: [{ model: ConversationParticipant, as: "participants" }],
                },
            ],
        });
        const existing = myConvRows.find((row) => {
            const participants = row.conversation?.participants || [];
            const ids = participants.map((p) => p.user_id);
            const idSet = new Set(ids);
            if (idSet.size !== desiredSet.size) return false;
            for (const id of desiredSet) {
                if (!idSet.has(id)) return false;
            }
            return true;
        });

        if (existing) {
            return res.status(200).json({ conversationId: existing.conversation_id });
        }

        const conv = await Conversation.create({
            subject,
            created_by: userId,
            created_by_role: userRole,
            last_message_at: null,
        });

        const participants = [
            { conversation_id: conv.id, user_id: userId, role: userRole },
            ...users.map((u) => ({ conversation_id: conv.id, user_id: u.id, role: u.role })),
        ];
        // dedupe
        const uniq = new Map();
        participants.forEach((p) => uniq.set(`${p.conversation_id}-${p.user_id}`, p));
        await ConversationParticipant.bulkCreate(Array.from(uniq.values()));

        res.status(201).json({ conversationId: conv.id });
    } catch (err) {
        console.error("❌ createConversation error", err);
        res.status(500).json({ message: "Failed to create conversation" });
    }
};

exports.listMessages = async (req, res) => {
    try {
        const { id } = req.params;
        const limit = Math.min(Number(req.query.limit) || 50, 100);
        const messages = await Message.findAll({
            where: { conversation_id: id },
            order: [["createdAt", "DESC"]],
            limit,
            include: [
                { model: MessageDelivery, as: "deliveries" },
                {
                    model: User,
                    as: "sender",
                    attributes: ["id", "username", "firstName", "lastName", "role", "avatarUrl"],
                },
            ],
        });
        res.json({ messages });
    } catch (err) {
        console.error("❌ listMessages error", err);
        res.status(500).json({ message: "Failed to fetch messages" });
    }
};

exports.sendMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { body, attachments } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        if (!body || typeof body !== "string") {
            return res.status(400).json({ message: "Message body required" });
        }

        const allowed = await canSendMessage(req.user);
        if (!allowed) {
            return res.status(403).json({ message: "Message limit reached for your plan" });
        }

        const message = await Message.create({
            conversation_id: id,
            sender_id: userId,
            sender_role: userRole,
            body,
            attachments: attachments || null,
        });

        // find recipients
        const participants = await ConversationParticipant.findAll({
            where: { conversation_id: id, user_id: { [Op.ne]: userId } },
        });
        const deliveries = participants.map((p) => ({
            message_id: message.id,
            recipient_id: p.user_id,
            delivered_at: new Date(),
        }));
        if (deliveries.length) await MessageDelivery.bulkCreate(deliveries);

        await Conversation.update(
            { last_message_at: new Date() },
            { where: { id } }
        );

        res.status(201).json({ message });
    } catch (err) {
        console.error("❌ sendMessage error", err);
        res.status(500).json({ message: "Failed to send message" });
    }
};

exports.markRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        await MessageDelivery.update(
            { read_at: new Date() },
            { where: { recipient_id: userId, message_id: id } }
        );
        res.json({ ok: true });
    } catch (err) {
        console.error("❌ markRead error", err);
        res.status(500).json({ message: "Failed to mark read" });
    }
};

exports.deleteConversation = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const exists = await ConversationParticipant.count({
            where: { conversation_id: id, user_id: userId },
        });
        if (!exists) return res.status(403).json({ message: "Not allowed" });

        await Conversation.destroy({ where: { id } });
        res.json({ ok: true });
    } catch (err) {
        console.error("❌ deleteConversation error", err);
        res.status(500).json({ message: "Failed to delete conversation" });
    }
};
