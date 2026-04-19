const os = require('os');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const AppError = require('./AppError');
const {
  UPLOAD_MAX_IMAGE_BYTES,
  UPLOAD_MAX_VIDEO_BYTES,
} = require('../config/env');

const TMP_DIR = path.join(os.tmpdir(), 'instagram_clone_uploads');

// Ensure temp directory exists once at startup.
fs.mkdirSync(TMP_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, TMP_DIR),
  filename: (_req, file, cb) => {
    // Avoid trusting original file name (security). Generate a random name instead.
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ext && ext.length <= 10 ? ext : '';
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `media-${unique}${safeExt}`);
  },
});

function fileTypeFilter(allowedKind) {
  // allowedKind: 'image', 'video', 'imageOrVideo'
  return (_req, file, cb) => {
    const mime = String(file.mimetype || '');
    const isImage = mime.startsWith('image/');
    const isVideo = mime.startsWith('video/');

    const ok =
      allowedKind === 'image'
        ? isImage
        : allowedKind === 'video'
          ? isVideo
          : isImage || isVideo;

    if (!ok) {
      const label = allowedKind === 'image' ? 'images' : allowedKind === 'video' ? 'videos' : 'images or videos';
      return cb(new AppError(`Invalid media type. Upload only ${label}.`, 400));
    }
    return cb(null, true);
  };
}

function createUploadMediaMiddleware({ allowedKind, fieldName = 'media' }) {
  const maxBytes =
    allowedKind === 'image'
      ? UPLOAD_MAX_IMAGE_BYTES
      : allowedKind === 'video'
        ? UPLOAD_MAX_VIDEO_BYTES
        : Math.max(UPLOAD_MAX_IMAGE_BYTES, UPLOAD_MAX_VIDEO_BYTES);

  const upload = multer({
    storage,
    limits: {
      fileSize: maxBytes,
      files: 1,
    },
    fileFilter: fileTypeFilter(allowedKind),
  });

  return upload.single(fieldName);
}

const uploadPostMedia = createUploadMediaMiddleware({ allowedKind: 'imageOrVideo' });
const uploadReelMedia = createUploadMediaMiddleware({ allowedKind: 'video' });
const uploadProfileImage = createUploadMediaMiddleware({ allowedKind: 'image' });

module.exports = {
  uploadPostMedia,
  uploadReelMedia,
  uploadProfileImage,
  createUploadMediaMiddleware,
};

