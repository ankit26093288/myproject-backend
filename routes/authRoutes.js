const express = require("express");
const { registerUser, verifyOtp, resendOtp } = require("../controllers/emailVerificationController");

const router = express.Router();

// Signup (with OTP email)
router.post("/signup", registerUser);

// Verify OTP
router.post("/verify-otp", verifyOtp);

// Resend OTP
router.post("/resend-otp", resendOtp);

module.exports = router;
