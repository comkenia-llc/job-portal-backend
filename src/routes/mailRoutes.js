const express = require("express");
const { authMiddleware, adminMiddleware } = require("../middlewares/authMiddleware");
const { sendMail, verifyMailConnection } = require("../services/mailService");

const router = express.Router();

router.get("/status", authMiddleware, adminMiddleware, async (req, res, next) => {
    try {
        await verifyMailConnection();

        res.json({
            success: true,
            message: "SMTP connection verified",
        });
    } catch (error) {
        next(error);
    }
});

router.post("/test", authMiddleware, adminMiddleware, async (req, res, next) => {
    try {
        const { to } = req.body || {};

        if (!to) {
            return res.status(400).json({ error: "'to' is required" });
        }

        const result = await sendMail({
            to,
            subject: "Dubai Job Zone SMTP Test",
            text: "This is a test email from Dubai Job Zone mail service.",
        });

        res.json({
            success: true,
            message: "Test email sent",
            messageId: result.messageId,
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
