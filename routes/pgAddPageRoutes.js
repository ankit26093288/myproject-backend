const express = require("express");
const router = express.Router();
const PgAddPage = require("../models/Pg");
const { authMiddleware } = require("../middleware/authMiddleware");


// Add new PG (specific page)
router.post("/add", async (req, res) => {
  try {
    const pgData = req.body;
    const newPg = new PgAddPage(pgData);
    await newPg.save();

    // ✅ send back the new PG id directly so frontend can redirect to /upload-images/:pgId
    res.status(201).json({
      message: "PG added successfully (AddPG page)",
      pgId: newPg._id,   // 👈 this is the key part
      pg: newPg,         // (optional, keep full PG data if needed)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
});


// Get all PGs added from this page
router.get("/all", async (req, res) => {
  try {
    const pgs = await PgAddPage.find();
    res.json(pgs);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});


router.delete("/:id",authMiddleware , async (req, res) => {
  try {
    const pg = await PgAddPage.findById(req.params.id);

    if (!pg) {
      return res.status(404).json({ message: "PG not found" });
    }

    // ✅ Check ownership
    if (pg.owner.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized to delete this PG" });
    }

    await PgAddPage.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "PG deleted successfully" });
  } catch (error) {
    console.error("Delete PG error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const pg = await PgAddPage.findById(req.params.id);
    if (!pg) return res.status(404).json({ message: "PG not found" });

    if (pg.owner.toString() !== req.userId)
      return res.status(403).json({ message: "Not authorized" });

    Object.assign(pg, req.body); // update all fields
    await pg.save();
    res.status(200).json({ message: "PG updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE a single image by index or URL
router.delete("/remove-image/:pgId", async (req, res) => {
  try {
    const { pgId } = req.params;
    const { imageUrl } = req.body; // frontend will send which image to remove

    const pg = await PgAddPage.findById(pgId);
    if (!pg) return res.status(404).json({ message: "PG not found" });

    // Filter out the removed image
    pg.imageUrls = pg.imageUrls.filter((url) => url !== imageUrl);

    await pg.save();
    res.status(200).json({ message: "Image removed successfully", pg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error removing image", error: err });
  }
});

module.exports = router;
