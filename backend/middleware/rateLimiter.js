/**
 * Express Rate Limiter Middleware
 * Protects authentication routes from brute force attacks and general APIs from abuse.
 */
const rateLimit = require('express-rate-limit');

const isTest = process.env.NODE_ENV === 'test';

// General auth limiter: max 30 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again after 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

// Stricter limiter for login specifically
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
  message: {
    success: false,
    error: 'Too many failed login attempts from this IP. Please try again in 15 minutes.',
    code: 'LOGIN_RATE_LIMIT_EXCEEDED'
  }
});

// General API protection: max 1000 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
  message: {
    success: false,
    error: 'Too many requests. Please try again later.',
    code: 'API_RATE_LIMIT_EXCEEDED'
  }
});

module.exports = {
  authLimiter,
  loginLimiter,
  apiLimiter
};
