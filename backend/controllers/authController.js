/**
 * Authentication Controller
 * Handles HTTP requests for registration, login, logout, and current user retrieval.
 */
const authService = require('../services/authService');
const { sendAuthCookie, clearAuthCookie } = require('../utils/tokenUtils');

async function register(req, res, next) {
  try {
    const { fullName, email, mobile, password, confirmPassword, termsAccepted } = req.body;

    const result = await authService.registerStudent({
      fullName,
      email,
      mobile,
      password,
      confirmPassword,
      termsAccepted
    });

    res.status(201).json({
      success: true,
      message: result.message,
      data: {
        user: result.user
      }
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const result = await authService.loginUser({ email, password });

    // Send HTTP-only session cookie
    sendAuthCookie(res, result.token);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: result.user,
        token: result.token // Also provide token for non-cookie API clients
      }
    });
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    clearAuthCookie(res);
    res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (error) {
    next(error);
  }
}

async function getCurrentUser(req, res, next) {
  try {
    // req.user was populated by authenticateUser middleware
    const safeUser = req.user.toSafeObject ? req.user.toSafeObject() : req.user;

    res.status(200).json({
      success: true,
      data: {
        user: safeUser
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  logout,
  getCurrentUser
};
