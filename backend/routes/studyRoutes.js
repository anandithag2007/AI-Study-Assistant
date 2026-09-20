const express = require("express");

const router = express.Router();

const verifyToken =
  require("../middleware/verifyToken");

const {
  getStudyHistory,
} = require("../controllers/studyController");

router.get(
  "/history",
  verifyToken,
  getStudyHistory
);

module.exports = router;