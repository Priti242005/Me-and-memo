const express = require('express');
const passport = require('passport');
const asyncHandler = require('../middleware/asyncHandler');
const authController = require('../controllers/authController');
const AppError = require('../middleware/AppError');
const { signAccessToken } = require('../config/jwt');

const router = express.Router();

// Backwards-compatible Auth: register + login (existing app)
router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));

// New secure auth flows
router.post('/signup', asyncHandler(authController.signup));
router.post('/verify-email', asyncHandler(authController.verifyEmail));

router.post('/send-login-otp', asyncHandler(authController.sendLoginOtp));
router.post('/verify-login-otp', asyncHandler(authController.verifyLoginOtp));

router.post('/forgot-password', asyncHandler(authController.forgotPassword));
router.post('/reset-password', asyncHandler(authController.resetPassword));

// Google OAuth (enabled only when env vars are present)
router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_CALLBACK_URL) {
    return next(new AppError('Google login is not configured', 503));
  }
  return passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
});

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?oauth=failed`,
  }),
  (req, res) => {
    const user = req.user;
    const token = signAccessToken(user._id);
    const redirectBase = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    return res.redirect(`${redirectBase}/oauth-success?token=${encodeURIComponent(token)}`);
  }
);

module.exports = router;

