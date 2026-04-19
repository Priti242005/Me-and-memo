const AppError = require('./AppError');
const { verifyAccessToken } = require('../config/jwt');

module.exports = function requireAuth(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authorization token missing', 401));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);
    req.user = { id: decoded.sub };
    return next();
  } catch (err) {
    return next(new AppError('Invalid or expired token', 401));
  }
};

