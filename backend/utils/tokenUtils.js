/**
 * JWT and Cookie Security Utilities
 */
const jwt = require('jsonwebtoken');
const config = require('../config/env');

const COOKIE_NAME = 'atcodes_token';

function signToken(payload) {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  });
}

function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

function getCookieOptions() {
  const isProduction = config.nodeEnv === 'production';
  const options = {
    httpOnly: true,
    secure: isProduction, // HTTPS only in production
    sameSite: isProduction ? (config.cookieSameSite || 'lax') : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: '/'
  };

  if (config.cookieDomain) {
    options.domain = config.cookieDomain;
  }

  return options;
}

function sendAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, getCookieOptions());
}

function clearAuthCookie(res) {
  const options = getCookieOptions();
  delete options.maxAge;
  res.clearCookie(COOKIE_NAME, options);
}

function extractToken(req) {
  // 1. Check HTTP-only cookie
  if (req.cookies && req.cookies[COOKIE_NAME]) {
    return req.cookies[COOKIE_NAME];
  }
  // 2. Check Authorization header: Bearer <token>
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
}

module.exports = {
  COOKIE_NAME,
  signToken,
  verifyToken,
  getCookieOptions,
  sendAuthCookie,
  clearAuthCookie,
  extractToken
};
