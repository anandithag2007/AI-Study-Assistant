const express = require("express");

const router = express.Router();

const verifyToken =
  require("../middleware/verifyToken");

const {
  explainTopic,
  generateNotes,
  generateQuiz,
  generateStudyPlan,
} = require("../controllers/aiController");

router.post(
  "/explain",
  verifyToken,
  explainTopic
);

router.post(
  "/notes",
  verifyToken,
  generateNotes
);

router.post(
  "/quiz",
  verifyToken,
  generateQuiz
);

router.post(
  "/study-plan",
  verifyToken,
  generateStudyPlan
);

module.exports = router;