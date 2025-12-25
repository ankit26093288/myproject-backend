const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User");
const PG = require("../models/Pg");
const Booking = require("../models/Booking");
const Review = require("../models/Review");
const Payment = require("../models/Payment");
const jwt = require("jsonwebtoken");
const protectStudent = require("../middleware/authMiddleware").authMiddleware;
const PDFDocument = require("pdfkit");
const path = require("path")

// --- Dashboard: Get student info ---
router.get("/dashboard", protectStudent, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Browse PGs ---
router.get("/browse", protectStudent, async (req, res) => {
  try {
    const pgs = await PG.find({ status: "approved" });
    res.json(pgs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- PG Details by ID ---
router.get("/pg/:id", protectStudent, async (req, res) => {
  try {
    const pg = await PG.findById(req.params.id).populate("owner", "name email phone");
    if (!pg) return res.status(404).json({ message: "PG not found" });
    res.json(pg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- My Bookings ---

router.get("/bookings", protectStudent, async (req, res) => {
  try {
    const bookings = await Booking.find({ student: req.userId })
      .populate("pg")
      .populate("student")
      .lean();

    const updated = await Promise.all(bookings.map(async (b) => {
      // safe student
      const safeStudent = b.student ? b.student : null;

      // Find payment linked to this booking
      const payment = await Payment.findOne({ booking: b._id }).sort({ createdAt: -1 }).lean();

      return {
        ...b,
        student: safeStudent,
        paymentStatus: payment ? payment.status : (b.paymentStatus || "unpaid")
      };
    }));

    res.json(updated);
  } catch (err) {
    console.error("Booking fetch error:", err);
    return res.status(500).json({ message: err.message });
  }
});




// --- Create Booking ---
router.post("/bookings", protectStudent, async (req, res) => {
  try {
    const { pgId, startDate, endDate } = req.body;
    if (!pgId || !startDate)
      return res.status(400).json({ message: "PG ID and start date required" });

    const booking = await Booking.create({
      pg: pgId,
      student: req.userId,
      startDate,
      endDate,
    });

    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Update Booking ---
router.put("/bookings/:id", protectStudent, async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, student: req.userId });
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const { startDate, endDate, status } = req.body;
    if (startDate) booking.startDate = startDate;
    if (endDate) booking.endDate = endDate;
    if (status && ["pending", "confirmed", "cancelled"].includes(status))
      booking.status = status;

    await booking.save();
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Delete Booking ---
router.delete("/bookings/:id", protectStudent, async (req, res) => {
  try {
    const booking = await Booking.findOneAndDelete({ _id: req.params.id, student: req.userId });
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    res.json({ message: "Booking cancelled successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- My Reviews ---
router.get("/reviews", protectStudent, async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.userId }).populate("pg", "name location");
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Create Review ---
router.post("/reviews", protectStudent, async (req, res) => {
  try {
    const { pgId, rating, comment } = req.body;
    if (!pgId || !rating) return res.status(400).json({ message: "PG ID and rating required" });

    const review = await Review.create({
      pg: pgId,
      user: req.userId,
      rating,
      comment,
    });

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Update Review ---
router.put("/reviews/:id", protectStudent, async (req, res) => {
  try {
    const review = await Review.findOne({ _id: req.params.id, user: req.userId });
    if (!review) return res.status(404).json({ message: "Review not found" });

    const { rating, comment } = req.body;
    if (rating) review.rating = rating;
    if (comment) review.comment = comment;

    await review.save();
    res.json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Delete Review ---
router.delete("/reviews/:id", protectStudent, async (req, res) => {
  try {
    const review = await Review.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!review) return res.status(404).json({ message: "Review not found" });

    res.json({ message: "Review deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Update Profile ---
router.put("/profile", protectStudent, async (req, res) => {
  try {
    const { name, phone, profileImage } = req.body;
    const user = await User.findById(req.userId);

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (profileImage) user.profileImage = profileImage;

    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/payments/:studentId", async (req, res) => {
  try {
    const payments = await Payment.find({ student: req.params.studentId })
      .populate("pg", "name location")
      .sort({ createdAt: -1 });

    res.json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


router.get("/invoice/:paymentId", async (req, res) => {
  try {
    const studentId = req.query.studentId; // get studentId from query param
    const payment = await Payment.findById(req.params.paymentId)
      .populate("pg", "name location address contact")
      .populate("student", "name email contact");

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    // ✅ Ensure student can only download their own payment
    if (payment.student._id.toString() !== studentId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const doc = new PDFDocument({ size: "A4", margin: 50 });

    const fileName = `Invoice_${payment._id}.pdf`;
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.setHeader("Content-Type", "application/pdf");

    // ---------------- HEADER ----------------
    const logoPath = path.join(__dirname, "../assets/logo.png");
    try {
      doc.image(logoPath, 50, 45, { width: 80 });
    } catch (err) {
      console.log("Logo not found, skipping image");
    }

    doc.fontSize(20)
       .fillColor("#2c3e50")
       .text("PG Finder Invoice", 150, 50, { align: "center" });

    doc.fontSize(10)
       .fillColor("#7f8c8d")
       .text("Professional PG Booking Invoice", 150, 75, { align: "center" });

    doc.moveDown();
    doc.moveTo(50, 120).lineTo(550, 120).strokeColor("#bdc3c7").lineWidth(1).stroke();

    // ---------------- INVOICE DETAILS ----------------
    doc.fontSize(12).fillColor("#2c3e50")
       .text(`Invoice ID: ${payment._id}`, 50, 140)
       .text(`Date: ${new Date(payment.createdAt).toLocaleString()}`, 50, 160)
       .text(`Status: ${payment.status}`, 50, 180);

    doc.text(`Student Name: ${payment.student.name}`, 300, 140)
       .text(`Email: ${payment.student.email}`, 300, 160)
       .text(`Contact: ${payment.student.contact}`, 300, 180);

   // ---------------- PAYMENT DETAILS TABLE ----------------
const tableTop = 220;
const itemX = 50;
const descX = 200;
const amountX = 450;

// Table headers
doc.fontSize(12).fillColor("#2c3e50")
   .text("PG Name", itemX, tableTop)
   .text("Address", descX, tableTop)
   .text("Amount", amountX, tableTop);

doc.moveTo(50, tableTop + 20).lineTo(550, tableTop + 20).stroke();

// Table row
const pgName = payment.pg.name;
const address = `${payment.pg.address}, ${payment.pg.location}`;
const pgContact = payment.pg.contact || "N/A";
const amount = `₹${payment.amount}`;

// Draw PG Name
doc.fontSize(12).text(pgName, itemX, tableTop + 30, { width: 140 });

// Draw Address and Contact with wrapping inside column width
doc.text(`${address}\nContact: ${pgContact}`, descX, tableTop + 30, {
  width: 230,
  align: "left",
});

// Draw Amount aligned at top of row
doc.text(amount, amountX, tableTop + 30, {
  width: 80,
  align: "right",
});

// Draw bottom line under row dynamically based on text height
const addressHeight = doc.heightOfString(`${address}\nContact: ${pgContact}`, { width: 230 });
const rowBottom = tableTop + 30 + addressHeight + 10;
doc.moveTo(50, rowBottom).lineTo(550, rowBottom).stroke();

// Total row
doc.fontSize(14).fillColor("#27ae60")
   .text(`Total Paid: ₹${payment.amount}`, amountX, rowBottom + 10, { align: "right" });


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
