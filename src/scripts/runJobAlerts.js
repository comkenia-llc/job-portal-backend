#!/usr/bin/env node
// Run with: node src/scripts/runJobAlerts.js
// Add to crontab: 0 8 * * * node /path/to/back/src/scripts/runJobAlerts.js

require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
require("../models"); // init Sequelize + associations

const { dispatchAlerts } = require("../controllers/jobAlertController");

(async () => {
    console.log("🔔 Running job alert dispatch...");
    await dispatchAlerts();
    console.log("✅ Done");
    process.exit(0);
})();
