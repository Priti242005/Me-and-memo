const path = require('path');
// Load `.env` from this project folder (fixes missing vars when cwd is not the repo root).
require('dotenv').config({ path: path.join(__dirname, '.env') });

const http = require('http');
const { Server } = require('socket.io');

const app = require('./app');
const { connectDB } = require('./config/db');
const { PORT, CORS_ORIGIN } = require('./config/env');
const { verifyAccessToken } = require('./config/jwt');
const { schedulePostUnlockJob } = require('./jobs/postUnlockCron');

async function start() {
  await connectDB();

  const server = http.createServer(app);

  const socketCorsOrigin =
    CORS_ORIGIN === '*'
      ? '*'
      : CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean);

  const io = new Server(server, {
    cors: {
      origin: socketCorsOrigin,
      methods: ['GET', 'POST'],
      credentials: false,
    },
  });

  // Make Socket.io instance available to controllers.
  app.locals.io = io;

  schedulePostUnlockJob(io);

  io.on('connection', (socket) => {
    // Token can be sent via `handshake.auth.token` (recommended) or query string.
    const token =
      socket.handshake.auth?.token || socket.handshake.query?.token;

    if (token) {
      try {
        const decoded = verifyAccessToken(String(token));
        socket.join(`user:${decoded.sub}`);
      } catch {
        // Ignore invalid tokens; socket will just not receive user room events.
      }
    }
  });

  server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on port ${PORT}`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server:', err);
  process.exit(1);
});

app.get("/", (req, res) => {
  res.json({ 
    message: "Backend is running successfully 🚀",
    status: "ok"
  });
});