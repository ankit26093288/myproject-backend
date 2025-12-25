const dashboardRoutes = require("./routes/dashboardRoutes.js");
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");


dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/users", require("./routes/userRoutes"));

app.use("/api/dashboard", dashboardRoutes);


const uploadRoutes = require("./routes/uploadRoutes");
app.use("/api/upload", uploadRoutes);


const pgRoutes = require("./routes/pgRoutes");
app.use("/api/pgs", pgRoutes);


app.use("/api/reviews", require("./routes/reviewRoutes"));



const bookingRoutes = require("./routes/bookingRoutes");
app.use("/api/bookings", bookingRoutes);


//admin routes
const adminRoutes = require("./routes/admin");
app.use("/api/admin", adminRoutes);


//student routes
const studentRoutes = require("./routes/studentRoutes");
app.use("/api/student", studentRoutes);



//email verification routes
// 🔹 Routes
const authRoutes = require("./routes/authRoutes");
//app.use("/api/users", authRoutes);


//ownerdashboard routes
const pgAddPageRoutes = require("./routes/pgAddPageRoutes");
app.use("/api/pg-add-page", pgAddPageRoutes);


//password reset routes
const resetPassRoutes = require("./routes/resetpass");
app.use("/api/email", resetPassRoutes);

//contact routes
const contactRoutes = require("./routes/contactRoutes");
app.use("/api/contact", contactRoutes);

const botRoutes = require("./routes/botRoutes");
app.use("/bot", botRoutes);

const paymentRoutes = require("./routes/paymentRoutes");
app.use("/api/payment", paymentRoutes);


app.get("/get-razorpay-key", (req, res) => {
  res.status(200).json({ key: process.env.RAZORPAY_KEY_ID });
});



// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
