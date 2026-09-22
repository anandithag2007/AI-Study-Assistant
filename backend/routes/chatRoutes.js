const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/verifyToken");

const {
  sendMessage,
  getMessages,
} = require("../controllers/chatController");

// SEND CHAT MESSAGE
router.post(
  "/",
  verifyToken,
  sendMessage
);

// GET CHAT MESSAGES
router.get(
  "/:conversationId",
  verifyToken,
  getMessages
);

module.exports = router;