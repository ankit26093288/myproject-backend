const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const Pg = require("../models/Pg");
const { authMiddleware } = require("../middleware/authMiddleware.js");


// ✅ Create a new booking
router.post("/", async (req, res) => {
  try {
    const { pgId, studentId, startDate, endDate } = req.body;

    // ✅ Check PG exists
    const pg = await Pg.findById(pgId);
    if (!pg) {
      return res.status(404).json({ message: "PG not found" });
    }

    // ✅ Convert dates to Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);

    // ✅ Check if overlapping booking exists for same PG
    const overlappingBooking = await Booking.findOne({
      pg: pgId,
      $or: [
        {
          startDate: { $lte: end },
          endDate: { $gte: start },
        },
      ],
    });

    if (overlappingBooking) {
      return res.status(400).json({
        message: "This PG is already booked for the selected dates.",
      });
    }

    // ✅ Check if rooms available
    if (pg.availableRooms <= 0) {
      return res.status(400).json({ message: "No rooms available" });
    }

    // ✅ Create booking
    const booking = await Booking.create({
      pg: pgId,
      student: studentId,
      startDate: start,
      endDate: end,
      status: "pending",
    });

    // ✅ Decrease available rooms
    pg.availableRooms -= 1;
    await pg.save();

    res.status(201).json({
      message: "Booking successful",
      booking,
    });
  } catch (error) {
    console.error("Booking API Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// ✅ Get all bookings for a student
router.get("/student/:studentId", async (req, res) => {
  try {
    const bookings = await Booking.find({ student: req.params.studentId })
      .populate("pg", "name location rent")
      .populate("student", "name email");
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// ✅ Cancel a booking
router.put("/:id/cancel", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.status = "cancelled";
    await booking.save();

    // Increase available rooms back
    const pg = await Pg.findById(booking.pg);
    if (pg) {
      pg.availableRooms += 1;
      await pg.save();
    }

    res.json({ message: "Booking cancelled", booking });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});


// GET /api/bookings/my
// Fetch bookings for the logged-in student
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({ student: req.user.id })
      .populate("pg", "name location rent imageUrls") // get PG info
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Error fetching bookings" });
  }
});


router.get("/by-owner/:ownerId", async (req, res) => {
  try {
    const ownerPgs = await Pg.find({ owner: req.params.ownerId }).select("_id");
    const pgIds = ownerPgs.map(pg => pg._id);

    const bookings = await Booking.find({ pg: { $in: pgIds } })
      .populate("student", "name email")
      .populate("pg", "name location");

    res.json(bookings);
  } catch (error) {
    console.error("Error fetching owner bookings:", error);
    res.status(500).json({ message: "Error fetching bookings" });
  }
});

// GET all bookings for a specific owner
router.get("/owner/:ownerId", authMiddleware, async (req, res) => {
  try {
    const { ownerId } = req.params;

    // ✅ Ensure logged-in user is same as ownerId
    if (req.userId !== ownerId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // ✅ Step 1: Find all PGs owned by this owner
    const pgs = await Pg.find({ owner: ownerId }).select("_id name location");
    if (!pgs.length) {
      return res.status(404).json({ message: "No PGs found for this owner" });
    }

    const pgIds = pgs.map(pg => pg._id);

    // ✅ Step 2: Find bookings for those PGs
    const bookings = await Booking.find({ pg: { $in: pgIds } })
      .populate("student", "name email")   // student details
      .populate("pg", "name location")     // pg details
      .sort({ createdAt: -1 });

    res.status(200).json({ pgs, bookings });
  } catch (err) {
    console.error("Error fetching owner bookings:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// PUT: Update booking status (confirm/reject)
router.put("/:id/status", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // "confirmed" or "cancelled"

    // Populate pg and owner from booking
    const booking = await Booking.findById(id).populate({
      path: "pg",
      select: "name owner",      // fetch owner field from PG
    });

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Check if logged-in user is the owner of the PG
    if (!booking.pg.owner || booking.pg.owner.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized to update this booking" });
    }

    booking.status = status;
    await booking.save();

    res.status(200).json({ message: `Booking ${status} successfully`, booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});



module.exports = router;
