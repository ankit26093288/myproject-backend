const express = require("express");
const {
  registerUser,
  loginUser,
  verifyOtp,
  resendOtp,
  testEmail,
} = require("../controllers/userControllers"); // CommonJS
const { authMiddleware } = require("../middleware/authMiddleware");
const User = require("../models/User");

const router = express.Router();

// ------------------- Public Routes -------------------

// Register new user → send OTP
router.post("/signup", registerUser);

// Login user
router.post("/login", loginUser);

// Verify OTP
router.post("/verify-otp", verifyOtp);

// Resend OTP
router.post("/resend-otp", resendOtp);

// Test email route (optional)
router.get("/test-email", testEmail);

// ------------------- Protected Routes -------------------

// Get user by ID (requires JWT auth)
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password"); // hide password
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router; // CommonJS export
