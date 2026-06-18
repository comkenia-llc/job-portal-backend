const { sendMail } = require("./mailService");
const {
    emailVerificationCodeTemplate,
} = require("../emails/templates/emailVerificationCodeTemplate");
const {
    resendVerificationTemplate,
} = require("../emails/templates/resendVerificationTemplate");
const {
    welcomeEmailTemplate,
} = require("../emails/templates/welcomeEmailTemplate");
const {
    candidateApplicationSubmittedTemplate,
} = require("../emails/templates/candidateApplicationSubmittedTemplate");
const {
    applicationStatusUpdatedTemplate,
} = require("../emails/templates/applicationStatusUpdatedTemplate");
const {
    employerNewApplicationTemplate,
} = require("../emails/templates/employerNewApplicationTemplate");
const {
    dailyJobAlertTemplate,
} = require("../emails/templates/dailyJobAlertTemplate");
const {
    weeklyJobDigestTemplate,
} = require("../emails/templates/weeklyJobDigestTemplate");

const templateRegistry = {
    emailVerificationCode: emailVerificationCodeTemplate,
    resendVerification: resendVerificationTemplate,
    welcomeEmail: welcomeEmailTemplate,
    candidateApplicationSubmitted: candidateApplicationSubmittedTemplate,
    applicationStatusUpdated: applicationStatusUpdatedTemplate,
    employerNewApplication: employerNewApplicationTemplate,
    dailyJobAlert: dailyJobAlertTemplate,
    weeklyJobDigest: weeklyJobDigestTemplate,
};

const getSiteUrl = () =>
    process.env.SITE_URL ||
    process.env.FRONTEND_URL ||
    "https://dubaijobzone.com";

const getSupportEmail = () =>
    process.env.MAIL_SUPPORT_EMAIL ||
    process.env.MAIL_FROM_EMAIL ||
    process.env.SMTP_USER ||
    "support@dubaijobzone.com";

const getMailLogoUrl = () => process.env.MAIL_LOGO_URL || "";

const renderTemplate = (templateName, data = {}) => {
    const template = templateRegistry[templateName];

    if (!template) {
        throw new Error(`Unknown mail template: ${templateName}`);
    }

    return template({
        siteUrl: getSiteUrl(),
        supportEmail: getSupportEmail(),
        logoUrl: getMailLogoUrl(),
        ...data,
    });
};

const sendTemplateMail = async ({
    template,
    to,
    replyTo,
    data = {},
}) => {
    const rendered = renderTemplate(template, data);

    return sendMail({
        to,
        subject: rendered.subject,
        text: rendered.text,
        html: rendered.html,
        replyTo,
    });
};

module.exports = {
    renderTemplate,
    sendTemplateMail,
    getSiteUrl,
    getSupportEmail,
    getMailLogoUrl,
};
