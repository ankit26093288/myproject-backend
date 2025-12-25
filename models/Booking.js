const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
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
  
  startDate: {
    type: Date,
    required: [true, "Start date is required"]
  },
  endDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled"],
    default: "pending"
  },
   paymentStatus: {
    type: String,
    enum: ["unpaid", "pending", "paid"],
    default: "unpaid"
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Booking", bookingSchema);
