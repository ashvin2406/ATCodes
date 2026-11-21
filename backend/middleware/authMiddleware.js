/**
 * Authentication and Authorization Middleware
 * Enforces role-based permissions and account status verification on the server.
 */
const User = require('../models/User');
const { verifyToken, extractToken } = require('../utils/tokenUtils');

async function authenticateUser(req, res, next) {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please sign in.',
        code: 'UNAUTHENTICATED'
      });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired session. Please sign in again.',
        code: 'TOKEN_INVALID'
      });
    }

    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User account no longer exists.',
        code: 'USER_NOT_FOUND'
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

function requireTeacher(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required.',
      code: 'UNAUTHENTICATED'
    });
  }

  if (req.user.role !== 'teacher') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Instructor privileges required.',
      code: 'FORBIDDEN_TEACHER_ONLY'
    });
  }

  next();
}

function requireStudent(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required.',
      code: 'UNAUTHENTICATED'
    });
  }

  if (req.user.role !== 'student') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Student portal access only.',
      code: 'FORBIDDEN_STUDENT_ONLY'
    });
  }

  next();
}

function requireActiveAccount(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required.',
      code: 'UNAUTHENTICATED'
    });
  }

  if (req.user.accountStatus === 'pending') {
    return res.status(403).json({
      success: false,
      error: 'Your account is pending instructor activation. Protected learning content is locked until approved.',
      code: 'ACCOUNT_PENDING'
    });
  }

  if (req.user.accountStatus === 'suspended') {
    return res.status(403).json({
      success: false,
      error: 'Your account has been suspended. Please contact the platform instructor.',
      code: 'ACCOUNT_SUSPENDED'
    });
  }

  next();
}

module.exports = {
  authenticateUser,
  requireTeacher,
  requireStudent,
  requireActiveAccount
};
