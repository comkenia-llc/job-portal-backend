// server.js
const app = require('./src/app');
const { sequelize } = require('./src/models');

const PORT = process.env.PORT || 4000;

async function startServer() {
    try {
        // test DB connection
        await sequelize.authenticate();
        console.log('✅ Database connected');

        app.listen(PORT, () => {
            console.log(`🚀 Server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Unable to connect to DB:', error);
        process.exit(1);
    }
}

startServer();
