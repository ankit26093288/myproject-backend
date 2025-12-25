const express = require("express");
const router = express.Router();
const PG = require("../models/Pg");

// Fetch PGs based on query
router.get("/search", async (req, res) => {
  try {
    const { city, maxPrice } = req.query;

    const filter = {};

    if (city) {
      filter.city = { $regex: new RegExp(city, "i") };
    }

    if (maxPrice) {
      filter.price = { $lte: Number(maxPrice) };
    }

    const pgs = await PG.find(filter).limit(10);

    res.json(pgs);
  } catch (error) {
    console.error("Bot Route Error:", error);
    res.status(500).json({ error: "Server Error" });
  }
});

module.exports = router;
