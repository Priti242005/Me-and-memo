const path = require('path');
const dotenv = require('dotenv');

// Resolve `.env` next to the repo root (same folder as `server.js`), not from `process.cwd()`.
dotenv.config({ path: path.join(__dirname, '..', '.env') });

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const NODE_ENV = process.env.NODE_ENV || 'development';

module.exports = {
  NODE_ENV,
  PORT: Number(process.env.PORT || 5000),
  MONGODB_URI: getRequiredEnv('MONGODB_URI'),
  JWT_SECRET: getRequiredEnv('JWT_SECRET'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  BCRYPT_SALT_ROUNDS: Number(process.env.BCRYPT_SALT_ROUNDS || 12),

  // Cloudinary credentials
  CLOUDINARY_CLOUD_NAME: getRequiredEnv('CLOUDINARY_CLOUD_NAME'),
  CLOUDINARY_API_KEY: getRequiredEnv('CLOUDINARY_API_KEY'),
  CLOUDINARY_API_SECRET: getRequiredEnv('CLOUDINARY_API_SECRET'),
  CLOUDINARY_FOLDER: process.env.CLOUDINARY_FOLDER || 'instagram_clone',

  // Upload constraints (bytes)
  // Recommended: adjust in your production environment.
  UPLOAD_MAX_IMAGE_BYTES: Number(process.env.UPLOAD_MAX_IMAGE_BYTES || 5_000_000), // 5MB
  UPLOAD_MAX_VIDEO_BYTES: Number(process.env.UPLOAD_MAX_VIDEO_BYTES || 50_000_000), // 50MB

  // CORS (comma-separated origins). Defaults to allow all.
  // Example: CORS_ORIGIN=http://localhost:3000,http://myapp.com
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
};

