const User = require("../models/User");

// Middleware to check specific role(s)
const authorizeRoles = (...roles) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!roles.includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Attach full user info if needed
      req.user = user;
      next();
    } catch (error) {
      console.error("Role check error:", error);
      res.status(500).json({ message: "Server error" });
    }
  };
};

module.exports = { authorizeRoles };
