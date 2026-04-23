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

fs.mkdirSync(TMP_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, TMP_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ext && ext.length <= 10 ? ext : '';
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `media-${unique}${safeExt}`);
  },
});

function fileTypeFilter(allowedKind) {
  return (_req, file, cb) => {
    const mime = String(file.mimetype || '');
    const isImage = mime.startsWith('image/');
    const isVideo = mime.startsWith('video/');
    const isAudio = mime.startsWith('audio/');

    const ok =
      allowedKind === 'image'
        ? isImage
        : allowedKind === 'video'
          ? isVideo
          : allowedKind === 'audio'
            ? isAudio
            : isImage || isVideo;

    if (!ok) {
      const label =
        allowedKind === 'image'
          ? 'images'
          : allowedKind === 'video'
            ? 'videos'
            : allowedKind === 'audio'
              ? 'audio files'
              : 'images or videos';
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

function createUploadBundleMiddleware() {
  const upload = multer({
    storage,
    limits: {
      fileSize: UPLOAD_MAX_VIDEO_BYTES,
      files: 2,
    },
    fileFilter: (_req, file, cb) => {
      if (file.fieldname === 'media') {
        return fileTypeFilter('imageOrVideo')(_req, file, cb);
      }
      if (file.fieldname === 'audio') {
        return fileTypeFilter('audio')(_req, file, cb);
      }
      return cb(new AppError('Invalid upload field.', 400));
    },
  });

  return upload.fields([
    { name: 'media', maxCount: 1 },
    { name: 'audio', maxCount: 1 },
  ]);
}

const uploadPostMedia = createUploadBundleMiddleware();
const uploadStoryMedia = createUploadBundleMiddleware();
const uploadReelMedia = createUploadMediaMiddleware({ allowedKind: 'video' });
const uploadProfileImage = createUploadMediaMiddleware({ allowedKind: 'image' });

module.exports = {
  uploadPostMedia,
  uploadStoryMedia,
  uploadReelMedia,
  uploadProfileImage,
  createUploadMediaMiddleware,
};
