// server.js
const http = require('http');
const app = require('./src/app');
const { sequelize } = require('./src/models');
const { initSocket } = require('./src/utils/socket');
const { isAllowedOrigin } = require('./src/utils/market');

const PORT = process.env.PORT || 4000;

async function startServer() {
    try {
        // test DB connection
        await sequelize.authenticate();
        console.log('✅ Database connected');

        const server = http.createServer(app);
        initSocket(require("socket.io")(server, {
            cors: {
                origin(origin, callback) {
                    if (!origin || isAllowedOrigin(origin)) {
                        return callback(null, true);
                    }
                    return callback(new Error("Not allowed by Socket.IO CORS"));
                },
                credentials: true,
                methods: ["GET", "POST"],
            },
        }));

        server.listen(PORT, () => {
            console.log(`🚀 Multi-market backend server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Unable to connect to DB:', error);
        process.exit(1);
    }
}

startServer();
