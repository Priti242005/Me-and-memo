const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendEmail({ to, subject, html, text }) {
  try {
    await transporter.sendMail({
      from: `"MeAndMemo" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text,
    });
  } catch (error) {
    console.log('Email error:', error);
    throw error;
  }
}

module.exports = { sendEmail };
