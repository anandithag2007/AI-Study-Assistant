const express = require("express");

const router = express.Router();

const verifyToken =
  require("../middleware/verifyToken");

const {
  getStudyHistory,
  getHistoryItem,
  deleteHistoryItem,
} = require("../controllers/studyController");

router.get(
  "/history",
  verifyToken,
  getStudyHistory
);

router.get(
  "/history/:id",
  verifyToken,
  getHistoryItem
);

router.delete(
  "/history/:id",
  verifyToken,
  deleteHistoryItem
);

module.exports = router;