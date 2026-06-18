const {
    sendTemplateMail,
    getSiteUrl,
    getAdminNotificationEmail,
} = require("../services/mailTemplateService");

const parseForwardedIp = (value) => {
    if (!value || typeof value !== "string") return "";
    return value.split(",")[0].trim();
};

const getRequestIpAddress = (req) =>
    parseForwardedIp(req.headers["x-forwarded-for"]) ||
    req.headers["cf-connecting-ip"] ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "";

exports.submitContactForm = async (req, res) => {
    try {
        const name = String(req.body?.name || "").trim();
        const email = String(req.body?.email || "").trim();
        const message = String(req.body?.message || "").trim();
        const phone = String(req.body?.phone || "").trim();
        const subject = String(req.body?.subject || "Contact form message").trim();

        if (!name || !email || !message) {
            return res.status(400).json({ error: "Name, email, and message are required" });
        }

        const siteUrl = getSiteUrl();
        const submittedAt = new Date();
        const sourcePage = req.headers.origin ? `${req.headers.origin}/contact` : `${siteUrl}/contact`;
        const ipAddress = getRequestIpAddress(req);
        const userAgent = req.headers["user-agent"] || "";

        await sendTemplateMail({
            template: "adminContactForm",
            to: getAdminNotificationEmail(),
            replyTo: email,
            data: {
                name,
                email,
                phone,
                subject,
                message,
                submittedAt,
                sourcePage,
                ipAddress,
                userAgent,
                adminDashboardUrl: `${siteUrl}/admin`,
            },
        });

        await sendTemplateMail({
            template: "contactFormConfirmation",
            to: email,
            data: {
                name,
                messageSubject: subject,
                message,
                submittedAt,
                jobsUrl: `${siteUrl}/jobs`,
                contactUrl: `${siteUrl}/contact`,
            },
        });

        res.status(201).json({ message: "Message received" });
    } catch (err) {
        console.error("❌ [CONTACT] submitContactForm error:", err);
        res.status(500).json({ error: "Failed to submit contact form" });
    }
};
