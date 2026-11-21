/**
 * Global Safe Error Handling Middleware
 */
const config = require('../config/env');

function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || 'Internal Server Error';
  let errorCode = err.code || null;

  // Handle Mongoose duplicate key error (E11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `An account with this ${field} already exists.`;
    errorCode = 'DUPLICATE_KEY';
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const messages = Object.values(err.errors).map(val => val.message);
    message = messages.join('. ');
    errorCode = 'VALIDATION_ERROR';
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token.';
    errorCode = 'TOKEN_INVALID';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired. Please sign in again.';
    errorCode = 'TOKEN_EXPIRED';
  }

  if (statusCode >= 500) {
    console.error(`[Server Error] [${req.method}] ${req.originalUrl}:`, err.message);
    if (config.nodeEnv !== 'production') {
      console.error(err.stack);
    }
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(errorCode ? { code: errorCode } : {}),
    ...(config.nodeEnv !== 'production' && statusCode >= 500 ? { stack: err.stack } : {})
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: `API route not found: ${req.method} ${req.originalUrl}`,
    code: 'ROUTE_NOT_FOUND'
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
