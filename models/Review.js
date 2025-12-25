const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  pg: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Pg",
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  rating: {
    type: Number,
    min: [1, "Rating must be at least 1"],
    max: [5, "Rating must be at most 5"],
    required: [true, "Rating is required"]
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [500, "Comment cannot be more than 500 characters"]
  }
}, {
  timestamps: true // adds createdAt & updatedAt
});

module.exports = mongoose.model("Review", reviewSchema);
