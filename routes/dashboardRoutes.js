const express = require("express");
const { getUserDashboard } = require("../controllers/dashboardController.js");
const { authMiddleware } = require("../middleware/authMiddleware.js");

const router = express.Router();

router.get("/", authMiddleware, getUserDashboard);

module.exports = router;
