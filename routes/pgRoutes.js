const express = require("express");
const Pg = require("../models/Pg");
const router = express.Router();
const { addPg , getAllPGs , getPGById } = require("../controllers/pgController");
const { authMiddleware } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const { uploadPGImages } = require("../controllers/imgpgController");

// Only authenticated users with role "owner" or "admin" can add PG

router.post("/", authMiddleware, authorizeRoles( "owner"), addPg);

router.post(
  "/upload-images",
  authMiddleware,
  authorizeRoles("owner"), // only owners/admins can upload
  uploadPGImages
);

router.get("/", getAllPGs);

// Get single PG by ID
router.get("/:id", getPGById);

// ✅ Get all PGs created by a specific owner
router.get("/owner/:ownerId", async (req, res) => {
  try {
    const ownerId = req.params.ownerId;
    const pgs = await Pg.find({ owner: ownerId })
      .populate("owner", "name email")
      .sort({ createdAt: -1 });

    res.json(pgs);
  } catch (error) {
    console.error("Error fetching PGs by owner:", error);
    res.status(500).json({ message: "Error fetching PGs" });
  }
});



module.exports = router;
