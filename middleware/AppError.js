class AppError extends Error {
  constructor(message, statusCode = 500, details) {
    super(message);
    this.statusCode = statusCode;
    if (details) this.details = details;
  }
}

module.exports = AppError;

