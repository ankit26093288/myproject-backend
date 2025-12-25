// reviewController.js
const Review = require("../models/Review");

// 📌 Get reviews for a specific PG
const getReviewsByPG = async (req, res) => {
  try {
    const { pgId } = req.params;
    const reviews = await Review.find({ pg: pgId })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    console.error("Get reviews error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 📌 Add new review
const addReview = async (req, res) => {
  try {
    const { pg, user, rating, comment } = req.body;

    if (!pg || !user || !rating || !comment) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newReview = new Review({
      pg,
      user,
      rating,
      comment,
    });

    await newReview.save();

    // populate user info for response
    await newReview.populate("user", "name email");

    res.status(201).json(newReview);
  } catch (error) {
    console.error("Add review error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { getReviewsByPG, addReview };
