const chalkLib = require("chalk");
const chalk = chalkLib.default || chalkLib;

const logger = {
    info: (msg) => console.log(chalk.cyan("ℹ️ ", msg)),
    success: (msg) => console.log(chalk.green("✅ ", msg)),
    warn: (msg) => console.log(chalk.yellow("⚠️ ", msg)),
    error: (msg) => console.log(chalk.red("❌ ", msg)),

    // ✅ Add this
    debug: (msg) => {
        if (process.env.DEBUG === "true") {
            console.log(chalk.gray("🐞 DEBUG:"), msg);
        }
    },
};

module.exports = logger;
