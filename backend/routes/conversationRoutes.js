const express = require("express");

const router = express.Router();

const verifyToken =
  require("../middleware/verifyToken");

const {
  createConversation,
  getConversations,
  getConversation,
  deleteConversation,
} = require("../controllers/conversationController");


// CREATE CONVERSATION
router.post(
  "/",
  verifyToken,
  createConversation
);


// GET ALL CONVERSATIONS
router.get(
  "/",
  verifyToken,
  getConversations
);


// GET ONE CONVERSATION
router.get(
  "/:id",
  verifyToken,
  getConversation
);


// DELETE CONVERSATION
router.delete(
  "/:id",
  verifyToken,
  deleteConversation
);


module.exports = router;