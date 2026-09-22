const { GoogleGenAI } = require("@google/genai");
const pool = require("../config/db");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// --------------------------------------------------
// GEMINI REQUEST WITH RETRY
// --------------------------------------------------

const generateWithRetry = async (prompt) => {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
      });

    } catch (error) {

      // --------------------------------------------
      // 429 = QUOTA / RATE LIMIT
      // --------------------------------------------
      // Do NOT retry a daily quota error.
      if (error.status === 429) {
        throw error;
      }

      // --------------------------------------------
      // 503 = TEMPORARILY UNAVAILABLE
      // --------------------------------------------
      if (
        error.status === 503 &&
        attempt < maxAttempts
      ) {
        console.log(
          `Gemini service is busy. Retrying... Attempt ${
            attempt + 1
          }/${maxAttempts}`
        );

        await new Promise((resolve) =>
          setTimeout(resolve, 2000)
        );

        continue;
      }

      throw error;
    }
  }
};

// --------------------------------------------------
// VERIFY CONVERSATION OWNERSHIP
// --------------------------------------------------

const verifyConversation = async (
  conversationId,
  userId
) => {
  const result = await pool.query(
    `
    SELECT id
    FROM conversations
    WHERE id = $1
    AND user_id = $2
    `,
    [conversationId, userId]
  );

  return result.rows.length > 0;
};

// --------------------------------------------------
// SEND CHAT MESSAGE
// --------------------------------------------------

const sendMessage = async (req, res) => {
  try {
    const {
      conversationId,
      message,
      difficulty,
    } = req.body;

    const userId = req.user.id;

    // --------------------------------------------
    // VALIDATE MESSAGE
    // --------------------------------------------

    if (!message || message.trim() === "") {
      return res.status(400).json({
        message: "Message is required",
      });
    }

    // --------------------------------------------
    // VALIDATE CONVERSATION
    // --------------------------------------------

    if (!conversationId) {
      return res.status(400).json({
        message: "Conversation ID is required",
      });
    }

    // --------------------------------------------
    // CHECK CONVERSATION BELONGS TO USER
    // --------------------------------------------

    const conversationExists =
      await verifyConversation(
        conversationId,
        userId
      );

    if (!conversationExists) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    // --------------------------------------------
    // SAVE USER MESSAGE
    // --------------------------------------------

    await pool.query(
      `
      INSERT INTO messages
      (
        conversation_id,
        user_id,
        role,
        content
      )
      VALUES ($1, $2, $3, $4)
      `,
      [
        conversationId,
        userId,
        "user",
        message.trim(),
      ]
    );

    // --------------------------------------------
    // GET PREVIOUS CHAT MESSAGES
    // --------------------------------------------

    const historyResult = await pool.query(
      `
      SELECT
        role,
        content
      FROM messages
      WHERE conversation_id = $1
      AND user_id = $2
      ORDER BY created_at ASC
      `,
      [
        conversationId,
        userId,
      ]
    );

    // --------------------------------------------
    // BUILD CHAT HISTORY
    // --------------------------------------------

    const chatHistory =
      historyResult.rows
        .map((item) => {
          return `${item.role}: ${item.content}`;
        })
        .join("\n\n");

    // --------------------------------------------
    // DIFFICULTY
    // --------------------------------------------

    const selectedDifficulty =
      difficulty || "Beginner";

    // --------------------------------------------
    // PROMPT
    // --------------------------------------------

    const prompt = `
You are an AI Study Assistant helping a student.

Student difficulty level:
${selectedDifficulty}

Conversation:

${chatHistory}

Instructions:
- Answer the student's latest question.
- Keep the explanation appropriate for the selected difficulty level.
- Use simple and clear language.
- Use headings and bullet points when useful.
- Give examples when they help understanding.
- If the student asks a follow-up question, use the previous conversation to understand the context.
- Do not repeat the entire previous answer unless necessary.
- Be educational and concise.
`;

    // --------------------------------------------
    // CALL GEMINI
    // --------------------------------------------

    const response =
      await generateWithRetry(prompt);

    const aiMessage =
      response.text;

    // --------------------------------------------
    // MAKE SURE AI RETURNED CONTENT
    // --------------------------------------------

    if (!aiMessage) {
      throw new Error(
        "Gemini returned an empty response"
      );
    }

    // --------------------------------------------
    // SAVE AI MESSAGE
    // --------------------------------------------

    await pool.query(
      `
      INSERT INTO messages
      (
        conversation_id,
        user_id,
        role,
        content
      )
      VALUES ($1, $2, $3, $4)
      `,
      [
        conversationId,
        userId,
        "assistant",
        aiMessage,
      ]
    );

    // --------------------------------------------
    // SEND RESPONSE TO FRONTEND
    // --------------------------------------------

    res.json({
      message: aiMessage,
    });

  } catch (error) {

    // --------------------------------------------
    // LOG REAL ERROR IN BACKEND TERMINAL
    // --------------------------------------------

    console.error("CHAT ERROR:");
    console.error(error);

    // --------------------------------------------
    // 429 - GEMINI QUOTA EXCEEDED
    // --------------------------------------------

    if (error.status === 429) {
      return res.status(429).json({
        message:
          "AI usage limit has been reached. Please try again after the Gemini quota resets.",
      });
    }

    // --------------------------------------------
    // 503 - GEMINI TEMPORARILY UNAVAILABLE
    // --------------------------------------------

    if (error.status === 503) {
      return res.status(503).json({
        message:
          "AI service is temporarily busy. Please try again in a few moments.",
      });
    }

    // --------------------------------------------
    // OTHER ERRORS
    // --------------------------------------------

    res.status(500).json({
      message:
        "Something went wrong while generating the AI response.",
    });
  }
};

// --------------------------------------------------
// GET CHAT MESSAGES
// --------------------------------------------------

const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    // --------------------------------------------
    // CHECK CONVERSATION OWNERSHIP
    // --------------------------------------------

    const conversationExists =
      await verifyConversation(
        conversationId,
        userId
      );

    if (!conversationExists) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    // --------------------------------------------
    // FETCH MESSAGES
    // --------------------------------------------

    const result = await pool.query(
      `
      SELECT
        id,
        role,
        content,
        created_at
      FROM messages
      WHERE conversation_id = $1
      AND user_id = $2
      ORDER BY created_at ASC
      `,
      [
        conversationId,
        userId,
      ]
    );

    res.json(result.rows);

  } catch (error) {

    console.error(
      "GET CHAT MESSAGES ERROR:"
    );

    console.error(error);

    res.status(500).json({
      message:
        "Failed to fetch chat messages",
    });
  }
};

// --------------------------------------------------
// EXPORT CONTROLLERS
// --------------------------------------------------

module.exports = {
  sendMessage,
  getMessages,
};