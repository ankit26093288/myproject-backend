// reviewRoutes.js
const express = require("express");
const router = express.Router();
const { getReviewsByPG ,addReview} = require("../controllers/reviewController");

router.get("/:pgId", getReviewsByPG);


// 📌 Fetch all reviews for a PG
router.get("/:pgId", getReviewsByPG);

// 📌 Add a new review
router.post("/", addReview);


module.exports = router;
