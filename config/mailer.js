const nodemailer = require('nodemailer');
const AppError = require('../middleware/AppError');

function getMailerConfig() {
  const user = (process.env.EMAIL_USER || '').trim();
  const pass = (process.env.EMAIL_PASS || '').trim();
  if (!user || !pass) {
    throw new AppError('Email service not configured (missing EMAIL_USER/EMAIL_PASS)', 503);
  }
  return { user, pass };
}

function createTransport() {
  const { user, pass } = getMailerConfig();
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

async function sendEmail({ to, subject, text }) {
  const transport = createTransport();
  const fromName = (process.env.EMAIL_FROM_NAME || 'Me & Memo').trim();
  const from = `${fromName} <${process.env.EMAIL_USER}>`;

  await transport.sendMail({
    from,
    to,
    subject,
    text,
  });
}

module.exports = { sendEmail };

