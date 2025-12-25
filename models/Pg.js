const mongoose = require('mongoose');

const PgSchema = new mongoose.Schema({
  // ✅ Existing fields
  name: {
    type: String,
    required: [true, "PG name is required"],
    trim: true
  },
  location: {
    type: String,
    required: [true, "Location is required"]
  },
  address: {
    type: String,
    required: [true, "Address is required"]
  },
  rent: {
    type: Number,
    required: [true, "Monthly rent is required"]
  },
  contact: {
    type: String,
    match: [/^\d{10}$/, "Please enter a valid 10-digit phone number"]
  },
  amenities: {
    type: [String], // e.g., ["WiFi", "AC", "Meals Included"]
    default: []
  },
  availableRooms: {
    type: Number,
    default: 0
  },
  imageUrls: {
    type: [String], // Array of image URLs
    default: []
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId, // Reference to User
    ref: "User",
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },

  // 🔹 New fields for modern 3-step form
  type: {
    type: String,
    enum: ["boys", "girls", "co-living", "mixed"],
    default: "boys"
  },
  sharingType: {
    type: String,
    enum: ["single", "double", "triple"],
    default: "single"
  },
  deposit: {
    type: Number,
    default: 0
  },
  locality: {
    type: String
  },
  landmark: {
    type: String
  },
  rules: {
    smokingAllowed: { type: Boolean, default: false },
    petsAllowed: { type: Boolean, default: false },
    guestsAllowed: { type: Boolean, default: true },
    entryTime: { type: String, default: "Anytime" },
    exitTime: { type: String, default: "Anytime" }
  },
  utilitiesIncluded: {
    type: [String], // e.g., ["Electricity", "Water", "Gas"]
    default: []
  },
  videoUrl: {
    type: String
  }

}, {
  timestamps: true // adds createdAt & updatedAt
});

// ✅ Fix: Prevent OverwriteModelError
module.exports = mongoose.models.Pg || mongoose.model("Pg", PgSchema);
