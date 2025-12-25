const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
const User = require("../models/User");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

// Setup storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "profile_pics", // Cloudinary folder name
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const upload = multer({ storage });

// Upload profile image route
router.post(
  "/profile-image",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      const userId = req.userId; // from authMiddleware
      const imageUrl = req.file.path; // secure URL from Cloudinary

      const user = await User.findByIdAndUpdate(
        userId,
        { profileImage: imageUrl },
        { new: true }
      ).select("-password");

      res.json({ message: "Profile image updated successfully", user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Image upload failed",error: err.message });
    }
  }
);

module.exports = router;
