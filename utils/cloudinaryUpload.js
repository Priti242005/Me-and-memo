const fs = require('fs/promises');
const path = require('path');

const { cloudinary, CLOUDINARY_FOLDER } = require('../config/cloudinary');
const AppError = require('../middleware/AppError');

function guessResourceType(mimetype) {
  if (String(mimetype || '').startsWith('video/')) return 'video';
  return 'image';
}

/**
 * Upload a local file to Cloudinary.
 * Stores only the Cloudinary `secure_url` in MongoDB.
 */
async function uploadToCloudinary({ localFilePath, mimetype, folder, resourceType }) {
  const folderName = folder || CLOUDINARY_FOLDER;
  const inferredResourceType = resourceType || guessResourceType(mimetype);

  const absolutePath = path.resolve(localFilePath);

  try {
    const uploadResult = await cloudinary.uploader.upload(absolutePath, {
      folder: folderName,
      resource_type: inferredResourceType,
      unique_filename: true,
      use_filename: false,
      overwrite: false,
      // Cloudinary will deliver files via HTTPS; secure_url is what we store.
      // `quality` and `fetch_format` are useful for images, and ignored for most videos.
      quality: 'auto',
      fetch_format: 'auto',
    });

    // `secure_url` is the safe HTTPS URL; never store `url`.
    return uploadResult.secure_url;
  } catch (err) {
    // Avoid leaking internal provider details.
    throw new AppError('Failed to upload media to Cloudinary', 502);
  } finally {
    // Best-effort cleanup of temp files.
    try {
      await fs.unlink(absolutePath);
    } catch {
      // Ignore cleanup errors to avoid masking the upload result.
    }
  }
}

module.exports = { uploadToCloudinary };

