const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  pg: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Pg",
    required: true
  },

  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  // NEW: link payment to booking
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking"
  },

  orderId: {
    type: String,
    required: true
  },

  paymentId: {
    type: String
  },

  signature: {
    type: String
  },

  amount: {
    type: Number,
    required: true
  },

  status: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending"
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Payment", paymentSchema);
