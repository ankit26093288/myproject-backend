const User = require("../models/User");
const nodemailer = require("nodemailer");

// 🔹 Setup nodemailer with debug/logging
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password
  },
  logger: true,
  debug: true,
});

// 🔹 Generic send email function
async function sendEmail(to, subject, text) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to, // dynamic recipient
      subject,
      text,
    });
    console.log("✅ Email sent:", info.response);
  } catch (err) {
    console.error("❌ Error sending email:", err);
    throw err; // so caller knows email failed
  }
}

// ------------------ CONTROLLERS ------------------

// Register new user → send OTP
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already exists" });

    const user = new User({ name, email, password, role });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000;

    await user.save();

    // Send OTP email
    await sendEmail(email, "Your OTP Code", `Your OTP is ${otp}. Expires in 5 minutes.`);

    res.json({ message: "Registered! Check your email for OTP.", email });
  } catch (err) {
    console.error("Register user error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
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

// Resend OTP
exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000;
    await user.save();

    // Send new OTP
    await sendEmail(email, "New OTP Code", `Your new OTP is ${otp}. Expires in 5 minutes.`);

    res.json({ message: "New OTP sent to your email." });
  } catch (err) {
    console.error("Resend OTP error:", err);
    res.status(500).json({ message: err.message });
  }
};

// 🔹 Optional: Test email route
exports.testEmail = async (req, res) => {
  try {
    await sendEmail(
      "mcaprojectpgfinderforstudent@gmail.com",
      "Test Email from PG Finder",
      "This is a test email. If you receive this, OTP will work too."
    );
    res.send("✅ Test email sent. Check inbox/spam.");
  } catch (err) {
    res.status(500).send("❌ Test email failed");
  }
};
