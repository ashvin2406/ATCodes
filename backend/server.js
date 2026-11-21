/**
 * ATCodes Backend Server Entry Point
 */
const app = require('./app');
const config = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');

async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB();

    const server = app.listen(config.port, () => {
      console.log('====================================================');
      console.log(`🚀 ATCodes Phase 2 Backend Server Active`);
      console.log(`📡 URL: http://localhost:${config.port}`);
      console.log(`🌐 Environment: ${config.nodeEnv}`);
      console.log(`🔒 Security: Helmet, CORS credentials, HTTP-only Cookies`);
      console.log(`👥 Seed Teacher: run "npm run seed:teacher" to initialize`);
      console.log('====================================================');
    });

    // Graceful Shutdown
    const shutdown = async (signal) => {
      console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectDB();
        console.log('[Server] Process terminated cleanly.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

  } catch (error) {
    console.error('[Server] Fatal startup error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
