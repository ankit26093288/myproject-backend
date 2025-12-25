const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("📡 Connecting to MongoDB...");
    console.log("🔗 URI:", process.env.MONGO_URI); // Show full connection string (without password if you want)

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Fail faster
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host} / DB: ${conn.connection.name}`);
  } catch (error) {
    console.error("❌ MongoDB Connection Failed");
    console.error("Error Name:", error.name);
    console.error("Error Message:", error.message);
    console.error("Full Error:", error);
    process.exit(1); // Stop the server
  }
};

module.exports = connectDB;
