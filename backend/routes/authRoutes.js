/**
 * Authentication Routes
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateUser } = require('../middleware/authMiddleware');
const { authLimiter, loginLimiter } = require('../middleware/rateLimiter');

// Public endpoints with rate-limiting
router.post('/register', authLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);
router.post('/logout', authController.logout);

// Protected session check
router.get('/me', authenticateUser, authController.getCurrentUser);

module.exports = router;
