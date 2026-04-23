const bcrypt = require('bcrypt');
const AppError = require('../middleware/AppError');
const User = require('../models/User');
const { signAccessToken } = require('../config/jwt');
const { BCRYPT_SALT_ROUNDS } = require('../config/env');
const { sendEmail } = require('../config/mailer');
const { sendEmail: sendOtpEmail } = require('../utils/sendEmail');
const { generateOtp, hashOtp, minutesFromNow } = require('../utils/otp');

function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

function requireNonEmptyString(value, fieldName) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new AppError(`${fieldName} is required`, 400);
  }
}

function safeUserPayload(userDoc) {
  return {
    id: userDoc._id,
    name: userDoc.name,
    username: userDoc.username,
    email: userDoc.email,
    profilePic: userDoc.profilePic,
    bio: userDoc.bio,
    followers: userDoc.followers.length,
    following: userDoc.following.length,
    isPrivate: Boolean(userDoc.isPrivate),
    isVerified: userDoc.isVerified !== false,
    // Used by the frontend to render Follow/Following state.
    followingIds: userDoc.following.map((id) => String(id)),
    followRequestIds: (userDoc.followRequests || []).map((id) => String(id)),
  };
}

function isVerified(userDoc) {
  // Backwards compatible: old users may not have isVerified field.
  return userDoc.isVerified !== false;
}

async function register(req, res) {
  const { username, email, password, profilePic, bio } = req.body || {};

  requireNonEmptyString(username, 'username');
  requireNonEmptyString(email, 'email');
  requireNonEmptyString(password, 'password');

  const normalizedEmail = normalizeEmail(email);

  const existing = await User.findOne({
    $or: [{ username: String(username).trim() }, { email: normalizedEmail }],
  });
  if (existing) {
    throw new AppError('Username or email already in use', 409);
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  const user = await User.create({
    username: String(username).trim(),
    email: normalizedEmail,
    password: passwordHash,
    profilePic: profilePic ? String(profilePic) : '',
    bio: bio ? String(bio) : '',
  });

  const token = signAccessToken(user._id);
  return res.status(201).json({ token, user: safeUserPayload(user) });
}

async function login(req, res) {
  const { email, username, password } = req.body || {};

  if ((!email && !username) || !password) {
    throw new AppError('email/username and password are required', 400);
  }

  if (typeof password !== 'string' || password.trim() === '') {
    throw new AppError('password is required', 400);
  }

  const query = {};
  if (email) query.email = normalizeEmail(email);
  if (username) query.username = String(username).trim();

  const user = await User.findOne(query).select('+password');
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  if (!isVerified(user)) {
    throw new AppError('Please verify your email to continue', 403);
  }

  if (!user.password) {
    throw new AppError('This account uses Google login. Continue with Google.', 400);
  }

  const matches = await user.comparePassword(password);
  if (!matches) {
    throw new AppError('Invalid credentials', 401);
  }

  const token = signAccessToken(user._id);
  return res.status(200).json({ token, user: safeUserPayload(user) });
}

/**
 * New signup flow: create account + send OTP email, do NOT auto-login.
 * POST /api/auth/signup
 */
async function signup(req, res) {
  const { name, username, email, password, profilePic, bio } = req.body || {};

  requireNonEmptyString(name, 'name');
  requireNonEmptyString(username, 'username');
  requireNonEmptyString(email, 'email');
  requireNonEmptyString(password, 'password');

  const normalizedEmail = normalizeEmail(email);

  const existing = await User.findOne({
    $or: [{ username: String(username).trim() }, { email: normalizedEmail }],
  });
  if (existing) {
    throw new AppError('Username or email already in use', 409);
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  const otp = generateOtp();
  const user = await User.create({
    name: String(name).trim().slice(0, 60),
    username: String(username).trim(),
    email: normalizedEmail,
    password: passwordHash,
    profilePic: profilePic ? String(profilePic) : '',
    bio: bio ? String(bio) : '',
    isVerified: false,
    otp: hashOtp(otp),
    otpExpiry: minutesFromNow(5),
  });

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('OTP (DEV MODE):', otp);
    return res.status(200).json({
      message: 'OTP generated (check server console)',
      otp,
      email: user.email,
    });
  }

  try {
    await sendOtpEmail({
      to: user.email,
      subject: 'Your OTP Code',
      html: `<h2>Your OTP is: ${otp}</h2>`,
      text: `Your Me & Memo verification OTP is: ${otp}\n\nThis code expires in 5 minutes.`,
    });
  } catch (error) {
    console.log('OTP (EMAIL FALLBACK):', otp);
    return res.status(200).json({
      message: 'OTP generated (check server console)',
      otp,
      email: user.email,
    });
  }

  return res.status(201).json({
    message: 'OTP sent to email',
    email: user.email,
  });
}

/**
 * Verify email OTP after signup.
 * POST /api/auth/verify-email
 */
async function verifyEmail(req, res) {
  const { email, otp } = req.body || {};
  requireNonEmptyString(email, 'email');
  requireNonEmptyString(otp, 'otp');

  const user = await User.findOne({ email: normalizeEmail(email) }).select(
    '+otp +otpExpiry'
  );
  if (!user) throw new AppError('Account not found', 404);

  if (isVerified(user)) {
    const token = signAccessToken(user._id);
    return res.status(200).json({ token, user: safeUserPayload(user) });
  }

  if (!user.otp || !user.otpExpiry || user.otpExpiry.getTime() < Date.now()) {
    throw new AppError('OTP expired. Please request a new OTP.', 400);
  }

  const matches = hashOtp(String(otp).trim()) === user.otp;
  if (!matches) throw new AppError('Invalid OTP', 400);

  user.isVerified = true;
  user.otp = '';
  user.otpExpiry = null;
  await user.save();

  const token = signAccessToken(user._id);
  return res.status(200).json({ token, user: safeUserPayload(user) });
}

/**
 * OTP login step 1 (passwordless):
 * POST /api/auth/send-login-otp
 */
async function sendLoginOtp(req, res) {
  const { email } = req.body || {};
  requireNonEmptyString(email, 'email');

  const user = await User.findOne({ email: normalizeEmail(email) }).select(
    '+otp +otpExpiry'
  );
  if (!user) throw new AppError('Account not found', 404);
  if (!isVerified(user)) throw new AppError('Please verify your email first', 403);

  const otp = generateOtp();
  user.otp = hashOtp(otp);
  user.otpExpiry = minutesFromNow(5);
  await user.save();

  await sendEmail({
    to: user.email,
    subject: 'Your login OTP',
    text: `Your Me & Memo login OTP is: ${otp}\n\nThis code expires in 5 minutes.`,
  });

  return res.status(200).json({ message: 'OTP sent to email' });
}

/**
 * OTP login step 2:
 * POST /api/auth/verify-login-otp
 */
async function verifyLoginOtp(req, res) {
  const { email, otp } = req.body || {};
  requireNonEmptyString(email, 'email');
  requireNonEmptyString(otp, 'otp');

  const user = await User.findOne({ email: normalizeEmail(email) }).select(
    '+otp +otpExpiry'
  );
  if (!user) throw new AppError('Account not found', 404);
  if (!isVerified(user)) throw new AppError('Please verify your email first', 403);

  if (!user.otp || !user.otpExpiry || user.otpExpiry.getTime() < Date.now()) {
    throw new AppError('OTP expired. Please request a new OTP.', 400);
  }

  const matches = hashOtp(String(otp).trim()) === user.otp;
  if (!matches) throw new AppError('Invalid OTP', 400);

  // Prevent OTP reuse.
  user.otp = '';
  user.otpExpiry = null;
  await user.save();

  const token = signAccessToken(user._id);
  return res.status(200).json({ token, user: safeUserPayload(user) });
}

/**
 * Forgot password: send reset OTP.
 * POST /api/auth/forgot-password
 */
async function forgotPassword(req, res) {
  const { email } = req.body || {};
  requireNonEmptyString(email, 'email');

  const user = await User.findOne({ email: normalizeEmail(email) }).select(
    '+resetPasswordToken +resetPasswordExpiry'
  );
  if (!user) throw new AppError('Account not found', 404);
  if (!isVerified(user)) throw new AppError('Please verify your email first', 403);
  if (user.googleId && !user.password) {
    throw new AppError('This account uses Google login. Reset is not available.', 400);
  }

  const otp = generateOtp();
  user.resetPasswordToken = hashOtp(otp);
  user.resetPasswordExpiry = minutesFromNow(5);
  await user.save();

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('RESET OTP:', otp);
    return res.status(200).json({
      message: 'OTP generated (check console)',
      otp,
    });
  }

  try {
    await sendOtpEmail({
      to: user.email,
      subject: 'Reset Password OTP',
      html: `<h2>Your Reset OTP is: ${otp}</h2>`,
      text: `Your Me & Memo password reset OTP is: ${otp}\n\nThis code expires in 5 minutes.`,
    });
  } catch (error) {
    console.log('RESET OTP:', otp);
    return res.status(200).json({
      message: 'OTP generated (check console)',
      otp,
    });
  }

  return res.status(200).json({ message: 'Password reset OTP sent' });
}

/**
 * Reset password using OTP.
 * POST /api/auth/reset-password
 */
async function resetPassword(req, res) {
  const { email, otp, newPassword } = req.body || {};
  requireNonEmptyString(email, 'email');
  requireNonEmptyString(otp, 'otp');
  requireNonEmptyString(newPassword, 'newPassword');

  const user = await User.findOne({ email: normalizeEmail(email) }).select(
    '+resetPasswordToken +resetPasswordExpiry +password'
  );
  if (!user) throw new AppError('Account not found', 404);
  if (!isVerified(user)) throw new AppError('Please verify your email first', 403);

  if (
    !user.resetPasswordToken ||
    !user.resetPasswordExpiry ||
    user.resetPasswordExpiry.getTime() < Date.now()
  ) {
    throw new AppError('Reset OTP expired. Please request a new one.', 400);
  }

  const matches = hashOtp(String(otp).trim()) === user.resetPasswordToken;
  if (!matches) throw new AppError('Invalid reset OTP', 400);

  user.password = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
  user.resetPasswordToken = '';
  user.resetPasswordExpiry = null;
  await user.save();

  return res.status(200).json({ message: 'Password updated successfully' });
}

module.exports = {
  // Backwards compatible routes (existing frontend)
  register,
  login,
  // New auth system
  signup,
  verifyEmail,
  sendLoginOtp,
  verifyLoginOtp,
  forgotPassword,
  resetPassword,
};
