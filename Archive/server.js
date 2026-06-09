// server.js
const http = require('http');
const app = require('./src/app');
const { sequelize } = require('./src/models');
const { initSocket } = require('./src/utils/socket');

const PORT = process.env.PORT || 4000;

// Keep Socket.IO CORS in sync with Express CORS
const allowedOrigins = [
    "https://accounts.keekan.com",
    "https://jobs.keekan.com",
    "https://education.keekan.com",
    "https://bank.keekan.com",
    "https://kids.keekan.com",
    "https://universitiesforllm.com",
    "https://universitiesforcs.com",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:4004",
];

async function startServer() {
    try {
        // test DB connection
        await sequelize.authenticate();
        console.log('✅ Database connected');

        const server = http.createServer(app);
        initSocket(require("socket.io")(server, {
            cors: {
                origin: allowedOrigins,
                credentials: true,
                methods: ["GET", "POST"],
            },
        }));

        server.listen(PORT, () => {
            console.log(`🚀 Dubai Job Zone Backend Server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Unable to connect to DB:', error);
        process.exit(1);
    }
}

startServer();
