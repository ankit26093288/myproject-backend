const User = require("../models/User.js");

// Example: Get logged-in user profile info
const getUserDashboard = async (req, res) => {
  try {
    // req.userId will be set by auth middleware after verifying JWT (see next step)
    const userId = req.userId;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Return user info or dashboard data
    res.json({
      message: "User dashboard data fetched successfully",
      user,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getUserDashboard };

