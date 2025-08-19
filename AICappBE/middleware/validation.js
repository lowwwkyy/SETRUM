const { body, validationResult } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Signup validation rules
const signupValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('displayName').trim().isLength({ min: 1 }),
  validate
];

// Login validation rules
const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').exists(),
  validate
];

// Google signin validation rules
const googleSigninValidation = [
  body('idToken').notEmpty(),
  validate
];

module.exports = {
  signupValidation,
  loginValidation,
  googleSigninValidation
};
