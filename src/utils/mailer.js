'use strict';
const nodemailer = require('nodemailer');

// Simple SMTP mailer used for employer notifications (status changes, interviews)
const buildTransporter = () => {
    if (!process.env.SMTP_HOST) {
        console.warn("⚠️ [MAILER] SMTP_HOST not set; emails will be skipped.");
        return null;
    }

    const port = Number(process.env.SMTP_PORT) || 587;
    const secure = port === 465;

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure,
        auth: process.env.SMTP_USER
            ? {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            }
            : undefined,
    });
};

const transporter = buildTransporter();

async function sendMail({ to, subject, text, html }) {
    if (!transporter) {
        console.warn("⚠️ [MAILER] Transporter not configured; email skipped.");
        return { skipped: true };
    }

    const from = process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@keekan.com";

    try {
        const info = await transporter.sendMail({ from, to, subject, text, html });
        console.log("📧 [MAILER] Sent mail:", info.messageId);
        return info;
    } catch (err) {
        console.error("❌ [MAILER] Failed to send mail:", err.message);
        throw err;
    }
}

module.exports = { sendMail };
