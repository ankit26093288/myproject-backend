const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
require("dotenv").config();

const Payment = require("../models/Payment");
const Booking = require("../models/Booking");

const router = express.Router();

// ==========================
// 🔍 DEBUG: Print Razorpay Keys
// ==========================
console.log("🔑 RAZORPAY_KEY_ID:", process.env.RAZORPAY_KEY_ID);
console.log("🔑 RAZORPAY_KEY_SECRET:", process.env.RAZORPAY_KEY_SECRET);

// ===============================
// 🔹 Create Razorpay Order + Save Payment
// ===============================


router.post("/create-order", async (req, res) => {
  const { amount, pgId, studentId, bookingId } = req.body;

  try {
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await instance.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    // Save payment
    const payment = await Payment.create({
      pg: pgId,
      student: studentId,
      orderId: order.id,
      amount,
      status: "pending",
    });

    // ⭐ VERY IMPORTANT: LINK PAYMENT TO BOOKING
    await Booking.findByIdAndUpdate(bookingId, {
      payment: payment._id
    });

    res.json({ success: true, order });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ===============================
// 🔹 Verify Payment + Update Payment + Create Booking
// ===============================
router.post("/verify-payment", async (req, res) => {
  console.log("\n📩 /verify-payment API CALLED");
  console.log("➡️ Request Body:", req.body);

  const { 
    razorpay_order_id, 
    razorpay_payment_id, 
    razorpay_signature,
    pgId,
    studentId,
    bookingId
  } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    console.log("❌ Signature mismatch → Payment Failed");
    return res.json({ success: false, message: "Payment verification failed" });
  }

  try {
    // Update the payment record (by orderId)
    const payment = await Payment.findOneAndUpdate(
      { orderId: razorpay_order_id },
      {
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        status: "paid"
      },
      { new: true }
    );

    if (!payment) {
      console.log("❌ Payment record not found for order:", razorpay_order_id);
      return res.json({ success: false, message: "Payment record not found" });
    }

    // If bookingId was provided in request, ensure we update that booking.
    // Otherwise try to find booking by payment.booking
    const bId = bookingId || payment.booking;

    if (bId) {
      // update booking to mark paid (don't create a new booking)
      await Booking.findByIdAndUpdate(bId, { $set: { paymentStatus: "paid" } });
    } else {
      // fallback: try find booking by (student + pg + status confirmed)
      const booking = await Booking.findOne({ student: studentId, pg: pgId, status: "confirmed" });
      if (booking) {
        await Booking.findByIdAndUpdate(booking._id, { $set: { paymentStatus: "paid" } });
      }
    }

    console.log("💰 Payment Verified and Booking updated:", payment._id);
    res.json({ success: true, message: "Payment verified", payment });
  } catch (err) {
    console.log("❌ ERROR Verifying Payment:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});


module.exports = router;
