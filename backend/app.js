/**
 * Express Application Configuration
 * Integrates security headers (Helmet), CORS with credentials, cookie parsing,
 * rate limiting, API routes, and static frontend delivery.
 */
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const config = require('./config/env');
const apiRoutes = require('./routes');
const { apiLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// Enable reverse proxy trust in production (Render, Railway, Heroku, Cloudflare, AWS)
app.set('trust proxy', 1);

// Security Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Allow CDN scripts (Tailwind, Lucide, Google Fonts)
    crossOriginEmbedderPolicy: false
  })
);

// CORS configuration for trusted frontend origins
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Check if origin matches configured allowed origins or trusted deploy platforms
      const isAllowed = config.frontendOrigins.some((allowed) => {
        return origin === allowed || allowed === '*';
      }) || origin.endsWith('.onrender.com') || origin.endsWith('.vercel.app') || origin.includes('localhost') || origin.includes('127.0.0.1');

      if (isAllowed || config.nodeEnv === 'development' || config.nodeEnv === 'test') {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Body parsers & Cookie parser
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser(config.cookieSecret));

// Mount REST API endpoints with general API rate limiting
app.use('/api', apiLimiter, apiRoutes);

// Serve Frontend Static Files with no-cache on HTML to guarantee immediate updates
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

// API 404 handler (for unmatched /api/* requests)
app.use('/api', notFoundHandler);

// Fallback: 404 page for unmatched web routes, or index.html for root
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  if (req.path === '/' || req.path === '') {
    return res.sendFile(path.join(frontendPath, 'index.html'));
  }
  // If specific page not found in static folder, serve custom 404 page
  const page404 = path.join(frontendPath, '404.html');
  res.status(404).sendFile(page404, (err) => {
    if (err) res.status(404).send('404 — Page Not Found');
  });
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
