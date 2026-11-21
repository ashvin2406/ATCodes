/**
 * Reusable MongoDB Connection Module using Mongoose
 * Configures connection pooling, reconnection listeners, and socket timeouts for production.
 */
const mongoose = require('mongoose');
const config = require('./env');

let isConnected = false;

async function connectDB(customUri = null) {
  const uri = customUri || config.mongodbUri;

  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    // Sanitize URI for safe console logging
    const sanitizedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
    console.log(`[Database] Connecting to MongoDB: ${sanitizedUri}`);

    await mongoose.connect(uri, {
      maxPoolSize: 50,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      autoIndex: config.nodeEnv !== 'production' // Only build indexes automatically in non-production to avoid startup performance hit
    });

    isConnected = true;
    console.log(`[Database] MongoDB Connected successfully (${mongoose.connection.host}/${mongoose.connection.name})`);

    mongoose.connection.on('error', (err) => {
      console.error('[Database] MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[Database] MongoDB disconnected. Mongoose will automatically attempt reconnection.');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('[Database] MongoDB reconnected successfully.');
      isConnected = true;
    });

    return mongoose.connection;
  } catch (error) {
    console.error('[Database] Failed to connect to MongoDB:', error.message);
    if (config.nodeEnv === 'production') {
      process.exit(1);
    }
    throw error;
  }
}

async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('[Database] MongoDB disconnected cleanly');
  }
}

module.exports = {
  connectDB,
  disconnectDB,
  getConnection: () => mongoose.connection
};
