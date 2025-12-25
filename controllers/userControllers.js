import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import nodemailer from "nodemailer";

// ------------------- Email Setup -------------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password
  },
  logger: true,
  debug: true,
});

async function sendEmail(to, subject, text) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    });
    console.log("✅ Email sent:", info.response);
  } catch (err) {
    console.error("❌ Error sending email:", err);
    throw err;
  }
}

// ------------------- Registration -------------------
const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Check if user exists
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User already exists" });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role,
      otp,
      otpExpiry: Date.now() + 5 * 60 * 1000, // 5 minutes
      verified: false,
    });

    // Send OTP email
    await sendEmail(email, "Your OTP Code", `Your OTP is ${otp}. Expires in 5 minutes.`);

    res.status(201).json({
      message: "Registered! OTP sent to your email.",
      email: user.email,
    });
  } catch (error) {
    console.error("Register user error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ------------------- Login -------------------
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    if (!user.verified) return res.status(400).json({ message: "Please verify your email first" });

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || "secretkey", {
      expiresIn: "1h",
    });

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------- Verify OTP -------------------
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    if (user.otp !== otp || user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.verified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.json({ message: "✅ Email verified successfully!" });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ------------------- Resend OTP -------------------
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000;
    await user.save();

    await sendEmail(email, "New OTP Code", `Your new OTP is ${otp}. Expires in 5 minutes.`);

    res.json({ message: "New OTP sent to your email." });
  } catch (err) {
    console.error("Resend OTP error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ------------------- Test Email -------------------
const testEmail = async (req, res) => {
  try {
    await sendEmail(
      "mcaprojectpgfinderforstudent@gmail.com",
      "Test Email from PG Finder",
      "This is a test email. If you receive this, OTP will work too."
    );
    res.send("✅ Test email sent. Check inbox/spam.");
  } catch (err) {
    console.error("Test email error:", err);
    res.status(500).send("❌ Test email failed");
  }
};

export { registerUser, loginUser, verifyOtp, resendOtp, testEmail };
