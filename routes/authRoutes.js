const express = require('express');
const passport = require('passport');
const asyncHandler = require('../middleware/asyncHandler');
const authController = require('../controllers/authController');
const AppError = require('../middleware/AppError');
const { signAccessToken } = require('../config/jwt');

const router = express.Router();

// ================== NORMAL AUTH ==================
router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));

router.post('/signup', asyncHandler(authController.signup));
router.post('/verify-email', asyncHandler(authController.verifyEmail));

router.post('/send-login-otp', asyncHandler(authController.sendLoginOtp));
router.post('/verify-login-otp', asyncHandler(authController.verifyLoginOtp));

router.post('/forgot-password', asyncHandler(authController.forgotPassword));
router.post('/reset-password', asyncHandler(authController.resetPassword));


// ================== GOOGLE AUTH ==================

// 🔥 STEP 1: Redirect to Google
router.get('/google', (req, res, next) => {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } = process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL) {
    return next(new AppError('Google login is not configured', 503));
  }

  console.log("👉 Redirecting to Google OAuth");
  console.log("👉 CALLBACK URL:", GOOGLE_CALLBACK_URL);

  return passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })(req, res, next);
});


// 🔥 STEP 2: Callback from Google
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?oauth=failed`,
  }),
  (req, res) => {
    try {
      const user = req.user;

      if (!user) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?oauth=failed`);
      }

      const token = signAccessToken(user._id);

      const redirectBase = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

      console.log("✅ Google Login Success");
      console.log("👉 Redirecting to:", redirectBase);

      return res.redirect(
        `${redirectBase}/oauth-success?token=${encodeURIComponent(token)}`
      );
    } catch (err) {
      console.error("❌ OAuth Callback Error:", err);
      return res.redirect(`${process.env.FRONTEND_URL}/login?oauth=failed`);
    }
  }
);

module.exports = router;