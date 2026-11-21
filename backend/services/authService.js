/**
 * Authentication Business Logic Service
 */
const User = require('../models/User');
const { validateRegistration, validateLogin } = require('../validators/authValidator');
const { signToken } = require('../utils/tokenUtils');

async function registerStudent(registrationData) {
  const { isValid, errors } = validateRegistration(registrationData);
  if (!isValid) {
    const error = new Error(errors.join(' '));
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = registrationData.email.toLowerCase().trim();

  // Check duplicate email
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error('An account with this email already exists. Please sign in or use a different email.');
    error.statusCode = 409;
    throw error;
  }

  // Hash password
  const passwordHash = await User.hashPassword(registrationData.password);

  // Create student account with pending status
  const newUser = await User.create({
    fullName: registrationData.fullName.trim(),
    email: normalizedEmail,
    mobile: registrationData.mobile.trim(),
    passwordHash: passwordHash,
    role: 'student',
    accountStatus: 'pending',
    profileImage: ''
  });

  return {
    user: newUser.toSafeObject(),
    message: 'Registration successful! Your account is pending teacher activation before accessing protected learning content.'
  };
}

async function loginUser(credentials) {
  const { isValid, errors } = validateLogin(credentials);
  if (!isValid) {
    const error = new Error(errors.join(' '));
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = credentials.email.toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await user.comparePassword(credentials.password);
  if (!isMatch) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  if (user.accountStatus === 'suspended') {
    const error = new Error('Your account has been suspended. Please contact the platform instructor.');
    error.statusCode = 403;
    error.code = 'ACCOUNT_SUSPENDED';
    throw error;
  }

  // Create secure JWT token
  const token = signToken({
    id: user._id.toString(),
    role: user.role,
    email: user.email
  });

  return {
    user: user.toSafeObject(),
    token
  };
}

async function getUserProfile(userId) {
  const user = await User.findById(userId).select('-passwordHash');
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }
  return user.toSafeObject();
}

module.exports = {
  registerStudent,
  loginUser,
  getUserProfile
};
