const nodemailer = require("nodemailer");

const DEFAULT_FROM_NAME = "Dubai Job Zone";
const DEFAULT_SMTP_HOST = "mail.dubaijobzone.com";
const DEFAULT_SMTP_PORT = 587;

const parseSecureValue = (value) => {
    if (typeof value === "boolean") {
        return value;
    }

    if (typeof value === "string") {
        return value.toLowerCase() === "true";
    }

    return false;
};

const getMailConfig = () => {
    const host = process.env.SMTP_HOST || DEFAULT_SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || DEFAULT_SMTP_PORT);
    const secure = parseSecureValue(process.env.SMTP_SECURE);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const fromName = process.env.MAIL_FROM_NAME || DEFAULT_FROM_NAME;
    const fromEmail = process.env.MAIL_FROM_EMAIL || user;

    if (!host || !user || !pass || !fromEmail) {
        throw new Error("SMTP configuration is incomplete");
    }

    return {
        host,
        port,
        secure,
        auth: {
            user,
            pass,
        },
        from: `${fromName} <${fromEmail}>`,
    };
};

const createTransporter = () => {
    const config = getMailConfig();

    return nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: config.auth,
        requireTLS: !config.secure,
    });
};

const sendMail = async ({ to, subject, text, html, replyTo } = {}) => {
    if (!to || !subject) {
        throw new Error("Both 'to' and 'subject' are required");
    }

    const transporter = createTransporter();
    const { from } = getMailConfig();

    return transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
        replyTo,
    });
};

const verifyMailConnection = async () => {
    const transporter = createTransporter();
    return transporter.verify();
};

module.exports = {
    sendMail,
    verifyMailConnection,
};
