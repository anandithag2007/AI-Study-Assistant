const pool = require("../config/db");


// CREATE CONVERSATION
const createConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({
        message: "Conversation title is required",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO conversations
      (user_id, title)
      VALUES ($1, $2)
      RETURNING *
      `,
      [userId, title.trim()]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error("CREATE CONVERSATION ERROR:");
    console.error(error);

    res.status(500).json({
      message: "Failed to create conversation",
    });
  }
};


// GET ALL CONVERSATIONS
const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        id,
        title,
        created_at
      FROM conversations
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );

    res.json(result.rows);

  } catch (error) {
    console.error("GET CONVERSATIONS ERROR:");
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch conversations",
    });
  }
};


// GET ONE CONVERSATION WITH ITS STUDY CONTENT
const getConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Check whether the conversation
    // belongs to the logged-in user
    const conversationResult = await pool.query(
      `
      SELECT
        id,
        title,
        created_at
      FROM conversations
      WHERE id = $1
      AND user_id = $2
      `,
      [id, userId]
    );

    if (conversationResult.rows.length === 0) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    // Get all study content belonging
    // to this conversation
    const historyResult = await pool.query(
      `
      SELECT
        id,
        topic,
        difficulty,
        content_type,
        content,
        created_at
      FROM study_history
      WHERE conversation_id = $1
      AND user_id = $2
      ORDER BY created_at ASC
      `,
      [id, userId]
    );

    res.json({
      conversation: conversationResult.rows[0],
      history: historyResult.rows,
    });

  } catch (error) {
    console.error("GET CONVERSATION ERROR:");
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch conversation",
    });
  }
};

// DELETE CONVERSATION
const deleteConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM conversations
      WHERE id = $1
      AND user_id = $2
      RETURNING id
      `,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    res.json({
      message:
        "Conversation deleted successfully",
    });

  } catch (error) {
    console.error(
      "DELETE CONVERSATION ERROR:"
    );
    console.error(error);

    res.status(500).json({
      message:
        "Failed to delete conversation",
    });
  }
};

module.exports = {
  createConversation,
  getConversations,
  getConversation,
  deleteConversation,
};