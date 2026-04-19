const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('./env');

function signAccessToken(userId) {
  return jwt.sign({ sub: String(userId) }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { signAccessToken, verifyAccessToken };

