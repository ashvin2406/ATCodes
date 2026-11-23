/**
 * Environment configuration loader and validator
 * Supports development, testing, and production environments.
 */
const path = require('path');
const dotenv = require('dotenv');

// Load .env from backend folder
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const corsRaw = process.env.CORS_ORIGINS || process.env.FRONTEND_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5000,http://127.0.0.1:5500,http://localhost:3000,http://127.0.0.1:3000,https://atcodes.onrender.com';
const parsedOrigins = corsRaw
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/atcodes',
  jwtSecret: process.env.JWT_SECRET || 'fallback_development_secret_do_not_use_in_prod',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieSecret: process.env.COOKIE_SECRET || 'atcodes_cookie_secret_dev_key',
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
  cookieSameSite: process.env.COOKIE_SAME_SITE || (process.env.NODE_ENV === 'production' ? 'lax' : 'lax'),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5000',
  frontendOrigins: parsedOrigins,
  seedTeacher: {
    name: process.env.SEED_TEACHER_NAME || 'Prof. Alex Turner',
    email: (process.env.SEED_TEACHER_EMAIL || 'teacher@atcodes.internal').toLowerCase().trim(),
    password: process.env.SEED_TEACHER_PASSWORD || 'ATCodesTeacher2026!',
    mobile: process.env.SEED_TEACHER_MOBILE || '+91 98765 00001'
  }
};

// Validate critical secrets in production
if (config.nodeEnv === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('SECURITY WARNING: JWT_SECRET must be set and at least 32 characters in production.');
  }
  if (!process.env.MONGODB_URI) {
    throw new Error('DATABASE WARNING: MONGODB_URI must be provided in production.');
  }
}

module.exports = config;
