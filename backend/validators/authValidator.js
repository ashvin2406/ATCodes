/**
 * Input validation and sanitization for Authentication and Teacher management
 */

function validateRegistration(data) {
  const errors = [];
  const { fullName, email, mobile, password, confirmPassword, termsAccepted } = data;

  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
    errors.push('Full name must be at least 2 characters.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    errors.push('Please enter a valid email address.');
  }

  if (!mobile || typeof mobile !== 'string' || mobile.trim().length < 6) {
    errors.push('Please enter a valid mobile number.');
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  }

  if (password !== confirmPassword) {
    errors.push('Passwords do not match.');
  }

  if (!termsAccepted && termsAccepted !== 'true' && termsAccepted !== true) {
    errors.push('You must accept the terms and conditions.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateLogin(data) {
  const errors = [];
  const { email, password } = data;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    errors.push('Please provide a valid email address.');
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.push('Password is required.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateStatusUpdate(status) {
  const validStatuses = ['pending', 'active', 'suspended'];
  if (!status || !validStatuses.includes(status)) {
    return {
      isValid: false,
      errors: [`Status must be one of: ${validStatuses.join(', ')}`]
    };
  }
  return { isValid: true, errors: [] };
}

module.exports = {
  validateRegistration,
  validateLogin,
  validateStatusUpdate
};
