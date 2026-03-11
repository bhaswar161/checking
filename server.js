const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = Number(process.env.PORT || 4173);

app.use(express.json());
app.use(express.static(path.join(__dirname)));

const otpStore = new Map();
const OTP_EXPIRY_MS = 5 * 60 * 1000;

const isValidEmail = (email) => /^\S+@\S+\.\S+$/.test(email);
const isValidPhone = (phone) => /^[+\d][\d\s-]{7,}$/.test(phone.trim());

const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || smtpUser;

let transporter = null;
if (smtpUser && smtpPass) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

app.post('/api/send-otp', async (req, res) => {
  const { email, phone } = req.body || {};

  if (!isValidEmail(String(email || '')) || !isValidPhone(String(phone || ''))) {
    return res.status(400).json({ message: 'Please provide a valid email and phone number.' });
  }

  if (!transporter) {
    return res.status(500).json({
      message: 'Email delivery is not configured. Set SMTP_USER and SMTP_PASS in .env.',
    });
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  otpStore.set(email.toLowerCase(), { otp, expiresAt: Date.now() + OTP_EXPIRY_MS, phone });

  try {
    await transporter.sendMail({
      from: smtpFrom,
      to: email,
      subject: 'Your Studyhub OTP Code',
      text: `Your Studyhub OTP is ${otp}. It is valid for 5 minutes.`,
      html: `<p>Your <strong>Studyhub OTP</strong> is <strong style="font-size:20px;">${otp}</strong>.</p><p>It is valid for 5 minutes.</p>`,
    });

    return res.json({ message: `OTP sent to ${email}. Please check your inbox.` });
  } catch (error) {
    console.error('OTP email error:', error);
    return res.status(500).json({ message: 'Failed to send OTP email. Check server configuration.' });
  }
});

app.post('/api/verify-otp', (req, res) => {
  const { email, phone, otp, mode } = req.body || {};
  const key = String(email || '').toLowerCase();
  const record = otpStore.get(key);

  if (!record) {
    return res.status(400).json({ message: 'No OTP found for this email. Request a new OTP.' });
  }

  if (record.expiresAt < Date.now()) {
    otpStore.delete(key);
    return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
  }

  if (record.phone !== phone) {
    return res.status(400).json({ message: 'Phone number does not match OTP request.' });
  }

  if (record.otp !== String(otp || '').trim()) {
    return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
  }

  otpStore.delete(key);
  const action = mode === 'signup' ? 'Account created' : 'Login verified';
  return res.json({ message: `${action} for ${email}. Access granted to Studyhub!` });
});

app.listen(PORT, () => {
  console.log(`Studyhub app running at http://localhost:${PORT}`);
});
