const Pg = require("../models/Pg");
const mongoose = require("mongoose");


const addPg = async (req, res) => {
  try {
    const { name, location, address, rent, contact, amenities, availableRooms } = req.body;

    if (!name || !location || !address || !rent) {
      return res.status(400).json({ message: "Name, location, address, and rent are required" });
    }

    const newPg = new Pg({
      name,
      location,
      address,
      rent,
      contact,
      amenities: Array.isArray(amenities) ? amenities : [],
      availableRooms: availableRooms || 0,
      imageUrls: [],
      owner: req.userId, // ✅ use userId from token
    });

    await newPg.save();
    res.status(201).json(newPg);
  } catch (error) {
    console.error("Add PG error:", error);
    res.status(500).json({ message: "Server Error1" });
  }
};


// ✅ Get all PGs (for student browsing)
const getAllPGs = async (req, res) => {
  try {
    const pgs = await Pg.find()
      .populate("owner", "name email role") // optional: owner info
      .sort({ createdAt: -1 }); // newest first

    res.json(pgs);
  } catch (error) {
    console.error("Get all PGs error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// pgController.js
const getPGById = async (req, res) => {
  try {
    const pg = await Pg.findById(req.params.id).populate("owner", "name email phone role");

    if (!pg) {
      return res.status(404).json({ message: "PG not found" });
    }

    res.json(pg); // only PG data
  } catch (error) {
    console.error("Get PG by ID error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


module.exports = { addPg ,getAllPGs , getPGById , };
