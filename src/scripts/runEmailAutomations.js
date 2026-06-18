require("dotenv").config();
const db = require("../models");
const {
    dispatchJobLifecycleEmails,
    dispatchSavedJobReminders,
    dispatchWalkInInterviewAlerts,
} = require("../services/emailAutomationService");

(async () => {
    try {
        console.log("📧 Running email automations...");
        await dispatchJobLifecycleEmails();
        await dispatchSavedJobReminders();
        await dispatchWalkInInterviewAlerts();
        console.log("✅ Email automations complete");
        process.exit(0);
    } catch (err) {
        console.error("❌ Email automations failed:", err);
        process.exit(1);
    } finally {
        await db.sequelize.close().catch(() => {});
    }
})();
