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
    const info = await transporter.sendMail({
      from: `"MeAndMemo" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text,
    });

    if (!info?.accepted || !info.accepted.length) {
      throw new Error('Email was not accepted by the mail transport');
    }

    console.log('Email sent:', {
      to,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    });

    return info;
  } catch (error) {
    console.log('Email error:', error);
    throw error;
  }
}

module.exports = { sendEmail };
