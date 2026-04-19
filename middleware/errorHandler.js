const AppError = require('./AppError');

// Centralized error handler. Keeps controller logic clean.
module.exports = function errorHandler(err, _req, res, _next) {
  // Handle multer-specific errors (file size, too many files, etc.).
  if (err && err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'Uploaded file is too large' });
    }
    return res.status(400).json({ message: err.message || 'Upload error' });
  }

  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;

  const message =
    isAppError || process.env.NODE_ENV === 'production'
      ? err.message || 'Internal Server Error'
      : err.stack || err.message || 'Internal Server Error';

  const payload = {
    message: isAppError ? err.message : 'Internal Server Error',
  };

  if (isAppError && err.details) payload.details = err.details;

  if (!isAppError && process.env.NODE_ENV !== 'production') {
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
};

