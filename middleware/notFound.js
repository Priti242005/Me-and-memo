const AppError = require('./AppError');

module.exports = function notFound(req, _res, next) {
  next(new AppError(`Not found: ${req.originalUrl}`, 404));
};

