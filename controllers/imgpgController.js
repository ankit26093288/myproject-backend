const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const Pg = require("../models/Pg");

// ✅ Multer memory storage (files kept in buffer)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Middleware-style handler to process multiple files
const uploadMiddleware = upload.array("images", 10); // max 10 images

// ✅ Upload images controller
const uploadPGImages = async (req, res) => {
  uploadMiddleware(req, res, async (err) => {
    if (err) {
      console.error("Multer error:", err);
      return res.status(400).json({ message: "File upload error", error: err });
    }

    try {
      const { pgId } = req.body;
      if (!pgId) {
        return res.status(400).json({ message: "PG ID is required" });
      }

      const pg = await Pg.findById(pgId);
      if (!pg) {
        return res.status(404).json({ message: "PG not found" });
      }

      // ✅ Check ownership
      if (pg.owner.toString() !== req.userId) {
        return res.status(403).json({ message: "You are not the owner of this PG" });
      }

      // ✅ Upload all images in parallel
      const uploadPromises = req.files.map((file) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "pg_images" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(file.buffer);
        });
      });

      const results = await Promise.all(uploadPromises);
      const uploadedUrls = results.map((r) => r.secure_url);

      // ✅ Update PG with new image URLs
      pg.imageUrls.push(...uploadedUrls);
      await pg.save();

      res.json({
        message: "Images uploaded successfully",
        imageUrls: pg.imageUrls,
      });
    } catch (error) {
      console.error("Upload controller error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
};

module.exports = {
  uploadPGImages,
};
