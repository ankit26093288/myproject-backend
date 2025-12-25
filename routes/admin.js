const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Pg = require("../models/Pg");
const Booking = require("../models/Booking");
const Review = require("../models/Review");
const Payment = require("../models/Payment");
const PDFDocument = require("pdfkit");

// GET /api/admin/dashboard
router.get("/dashboard", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalOwners = await User.countDocuments({ role: "owner" });
    const totalStudents = await User.countDocuments({ role: "student" });
    const totalPgs = await Pg.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const totalReviews = await Review.countDocuments();

    res.json({
      totalUsers,
      totalOwners,
      totalStudents,
      totalPgs,
      totalBookings,
      totalReviews
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});



// 🔹 GET all users
// GET /api/admin/users
router.get("/users", async (req, res) => {
  try {
    // You can filter if needed, e.g., role=student or owner
    const users = await User.find().select("-password"); // exclude password
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// 🔹 DELETE a user by ID
// DELETE /api/admin/users/:id
router.delete("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

   await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});


// 🔹 GET all PGs
// GET /api/admin/pgs
router.get("/pgs", async (req, res) => {
  try {
    // populate owner name
    const pgs = await Pg.find().populate("owner", "name email");
    res.json(pgs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// 🔹 UPDATE PG status (approve/reject)
// PATCH /api/admin/pgs/:id/status
router.patch("/pgs/:id/status", async (req, res) => {
  try {
    const { status } = req.body; // "approved" or "rejected"
    const pg = await Pg.findById(req.params.id);
    if (!pg) return res.status(404).json({ message: "PG not found" });

    pg.status = status;
    await pg.save();
    res.json({ message: `PG ${status} successfully`, pg });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// 🔹 DELETE a PG
// DELETE /api/admin/pgs/:id
router.delete("/pgs/:id", async (req, res) => {
  try {
    const pg = await Pg.findById(req.params.id);
    if (!pg) return res.status(404).json({ message: "PG not found" });

    await Pg.findByIdAndDelete(req.params.id);
    res.json({ message: "PG deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});


// 🔹 GET all bookings
// GET /api/admin/bookings
router.get("/bookings", async (req, res) => {
  try {
    // populate student and PG info
    const bookings = await Booking.find()
      .populate("student", "name email")
      .populate("pg", "name location rent");

    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// 🔹 UPDATE booking status (confirm/cancel)
// PATCH /api/admin/bookings/:id/status
router.patch("/bookings/:id/status", async (req, res) => {
  try {
    const { status } = req.body; // "confirmed" or "cancelled"
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.status = status;
    await booking.save();
    res.json({ message: `Booking ${status} successfully`, booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});



// 🔹 GET all reviews

// GET /api/admin/reviews
router.get("/reviews", async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("pg", "name")
      .populate("user", "name email");

    res.json(reviews);
  } catch (error) {
    console.error("💥 Review fetch error:", error); // log full error
    res.status(500).json({
      message: "Server Error",
      error: error.message, // send actual error message in response (for dev only)
    });
  }
});


// 🔹 DELETE a review
// DELETE /api/admin/reviews/:id
router.delete("/reviews/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid review ID" });
    }

    const deletedReview = await Review.findByIdAndDelete(id);

    if (!deletedReview) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("💥 DELETE review error:", error);
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
});




// 🔹 GET admin profile
// GET /api/admin/profile
router.get("/profile/:id", async (req, res) => {
  try {
    const admin = await User.findById(req.params.id).select("-password");
    if (!admin) return res.status(404).json({ message: "Admin not found" });
    res.json(admin);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// 🔹 UPDATE profile
// PUT /api/admin/profile/:id
router.put("/profile/:id", async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const admin = await User.findById(req.params.id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    admin.name = name || admin.name;
    admin.email = email || admin.email;
    admin.phone = phone || admin.phone;

    await admin.save();
    res.json({ message: "Profile updated successfully", admin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// 🔹 CHANGE password
// PUT /api/admin/profile/:id/password
router.put("/profile/:id/password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = await User.findById(req.params.id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);

    await admin.save();
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});


// Get all payments
router.get("/payments", async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("pg", "name location")
      .populate("student", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


router.get("/invoice/:paymentId", async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId)
      .populate("pg", "name location address")
      .populate("student", "name email contact");

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    const doc = new PDFDocument({ size: "A4", margin: 50 });

    const fileName = `Invoice_${payment._id}.pdf`;
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.setHeader("Content-Type", "application/pdf");

    // ---------------- HEADER ----------------
    doc.image("assets/logo.png", 50, 45, { width: 100 }) // add your logo path
       .fontSize(20)
       .fillColor("#2c3e50")
       .text("PG Finder", 160, 50)
       .fontSize(10)
       .fillColor("#7f8c8d")
       .text("Professional PG Booking Invoice", 160, 75)
       .moveDown();

    doc.strokeColor("#bdc3c7").lineWidth(1).moveTo(50, 120).lineTo(550, 120).stroke();

    // ---------------- INVOICE DETAILS ----------------
    doc.fontSize(12).fillColor("#2c3e50")
       .text(`Invoice ID: ${payment._id}`, 50, 140)
       .text(`Date: ${new Date(payment.createdAt).toLocaleString()}`, 50, 160)
       .text(`Status: ${payment.status}`, 50, 180);

    doc.text(`Student Name: ${payment.student.name}`, 300, 140)
       .text(`Email: ${payment.student.email}`, 300, 160)
       .text(`Contact: ${payment.student.contact}`, 300, 180);

    // ---------------- PAYMENT DETAILS TABLE ----------------
    doc.moveDown().moveDown();

    const tableTop = 220;
    const itemX = 50;
    const descX = 200;
    const amountX = 450;

    doc.fontSize(12).text("PG Name", itemX, tableTop, { bold: true });
    doc.text("Address", descX, tableTop);
    doc.text("Amount", amountX, tableTop);

    doc.moveTo(50, tableTop + 20).lineTo(550, tableTop + 20).stroke();

    doc.fontSize(12)
       .text(payment.pg.name, itemX, tableTop + 30)
       .text(`${payment.pg.address}, ${payment.pg.location}`, descX, tableTop + 30)
       .text(`₹${payment.amount}`, amountX, tableTop + 30);

    // ---------------- TOTAL ----------------
    doc.moveTo(50, tableTop + 70).lineTo(550, tableTop + 70).stroke();
    doc.fontSize(14).fillColor("#27ae60").text(`Total Paid: ₹${payment.amount}`, amountX, tableTop + 80);

    // ---------------- FOOTER ----------------
    doc.fontSize(10).fillColor("#7f8c8d")
       .text("PG Finder - Your trusted PG booking partner", 50, 750, { align: "center", width: 500 });

    doc.end();
    doc.pipe(res);

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
