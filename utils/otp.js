const crypto = require('crypto');
const otpGenerator = require('otp-generator');

function generateOtp() {
  return otpGenerator.generate(6, {
    digits: true,
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });
}

function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

function minutesFromNow(min) {
  return new Date(Date.now() + Number(min) * 60_000);
}

module.exports = { generateOtp, hashOtp, minutesFromNow };

