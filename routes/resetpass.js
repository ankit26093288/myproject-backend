// routes/auth.js (or routes/users.js)
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const User = require("../models/User");

// --- Setup nodemailer transporter (use env variables) ---
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Helper to send email (simple)
async function sendResetEmail(to, resetUrl) {
  const mailOptions = {
    from: process.env.FROM_EMAIL,
    to,
    subject: "Reset your PG Finder password",
    html: `
      <p>You requested a password reset. Click the link below to reset your password. This link will expire in ${process.env.RESET_TOKEN_EXPIRES_MIN || 60} minutes.</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>If you did not request a password reset, ignore this email.</p>
    `,
  };
  return transporter.sendMail(mailOptions);
}

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) {
      // For security, return success even if user not found (avoid email enumeration)
      return res.status(200).json({ message: "If that email exists, a reset link was sent." });
    }

    // Generate secure token (raw token sent in email)
    const rawToken = crypto.randomBytes(32).toString("hex");
    // Store hashed token in DB (so DB doesn't hold the raw token)
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expires = Date.now() + (Number(process.env.RESET_TOKEN_EXPIRES_MIN || 60) * 60 * 1000);

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(expires);
    await user.save();

    // Build reset url for frontend
   const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}&email=${email}`;

    // Send email
    await sendResetEmail(email, resetUrl);

    return res.status(200).json({ message: "If that email exists, a reset link was sent." });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const token = req.body.token || req.query.token;
    const email = req.body.email || req.query.email;
    const password = req.body.password;

    if (!token || !email || !password) {
      return res.status(400).json({ message: "Token, email and new password are required" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      email,
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ message: "Server error1" });
  }
});


module.exports = router;
