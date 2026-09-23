const { GoogleGenAI } = require("@google/genai");
const pool = require("../config/db");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});


// =========================
// GEMINI GENERATION WITH FAST RETRY
// =========================

const generateWithRetry = async (prompt) => {
  const maxAttempts = 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
      });

    } catch (error) {
      // Only retry temporary Gemini 503 errors
      if (
        error.status !== 503 ||
        attempt === maxAttempts
      ) {
        throw error;
      }

      console.log(
        "Gemini service is busy. Retrying once..."
      );

      // Short 1-second retry delay
      await new Promise((resolve) =>
        setTimeout(resolve, 1000)
      );
    }
  }
};


// =========================
// CHECK CONVERSATION OWNERSHIP
// =========================

const verifyConversation = async (
  conversationId,
  userId
) => {
  if (!conversationId) {
    return false;
  }

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


// =========================
// EXPLAIN TOPIC
// =========================

const explainTopic = async (req, res) => {
  try {
    const {
      topic,
      difficulty,
      conversationId,
    } = req.body;

    const userId = req.user.id;

    if (!topic || topic.trim() === "") {
      return res.status(400).json({
        message: "Topic is required",
      });
    }

    if (!difficulty) {
      return res.status(400).json({
        message: "Difficulty is required",
      });
    }

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

    const prompt = `
You are an AI Study Assistant.

Explain the topic "${topic}" for a ${difficulty} level student.

Requirements:
- Use simple language.
- Add headings.
- Give examples.
- Use bullet points where needed.
- End with a short summary.
`;

    const response =
      await generateWithRetry(prompt);

    await pool.query(
      `
      INSERT INTO study_history
      (
        user_id,
        conversation_id,
        topic,
        difficulty,
        content_type,
        content
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        userId,
        conversationId,
        topic,
        difficulty,
        "explanation",
        response.text,
      ]
    );

    res.json({
      explanation: response.text,
    });

  } catch (error) {
    console.error(
      "EXPLAIN TOPIC ERROR:"
    );
    console.error(error);

    if (error.status === 503) {
      return res.status(503).json({
        message:
          "AI service is busy right now. Please try again in a few moments.",
      });
    }

    res.status(500).json({
      message: "AI generation failed",
    });
  }
};


// =========================
// GENERATE NOTES
// =========================

const generateNotes = async (req, res) => {
  try {
    const {
      topic,
      difficulty,
      conversationId,
    } = req.body;

    const userId = req.user.id;

    if (!topic || topic.trim() === "") {
      return res.status(400).json({
        message: "Topic is required",
      });
    }

    if (!difficulty) {
      return res.status(400).json({
        message: "Difficulty is required",
      });
    }

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

    const prompt = `
Create concise study notes on "${topic}"
for a ${difficulty} level student.

Requirements:
- Short and exam-oriented
- Use bullet points
- Include key concepts
- Include important terms
- Include a quick summary
`;

    const response =
      await generateWithRetry(prompt);

    await pool.query(
      `
      INSERT INTO study_history
      (
        user_id,
        conversation_id,
        topic,
        difficulty,
        content_type,
        content
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        userId,
        conversationId,
        topic,
        difficulty,
        "notes",
        response.text,
      ]
    );

    res.json({
      notes: response.text,
    });

  } catch (error) {
    console.error(
      "GENERATE NOTES ERROR:"
    );
    console.error(error);

    if (error.status === 503) {
      return res.status(503).json({
        message:
          "AI service is busy right now. Please try again in a few moments.",
      });
    }

    res.status(500).json({
      message: "Notes generation failed",
    });
  }
};


// =========================
// GENERATE QUIZ
// =========================

const generateQuiz = async (req, res) => {
  try {
    const {
      topic,
      difficulty,
      conversationId,
    } = req.body;

    const userId = req.user.id;

    if (!topic || topic.trim() === "") {
      return res.status(400).json({
        message: "Topic is required",
      });
    }

    if (!difficulty) {
      return res.status(400).json({
        message: "Difficulty is required",
      });
    }

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

    const prompt = `
Create 5 multiple choice questions about "${topic}"
for a ${difficulty} level student.

Format:

Question 1
A.
B.
C.
D.

Answer:

Question 2
A.
B.
C.
D.

Answer:

Question 3
A.
B.
C.
D.

Answer:

Question 4
A.
B.
C.
D.

Answer:

Question 5
A.
B.
C.
D.

Answer:

Do not include explanations.
`;

    const response =
      await generateWithRetry(prompt);

    await pool.query(
      `
      INSERT INTO study_history
      (
        user_id,
        conversation_id,
        topic,
        difficulty,
        content_type,
        content
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        userId,
        conversationId,
        topic,
        difficulty,
        "quiz",
        response.text,
      ]
    );

    res.json({
      quiz: response.text,
    });

  } catch (error) {
    console.error(
      "GENERATE QUIZ ERROR:"
    );
    console.error(error);

    if (error.status === 503) {
      return res.status(503).json({
        message:
          "AI service is busy right now. Please try again in a few moments.",
      });
    }

    res.status(500).json({
      message: "Quiz generation failed",
    });
  }
};


// =========================
// GENERATE STUDY PLAN
// =========================

const generateStudyPlan = async (req, res) => {
  try {
    const {
      topic,
      difficulty,
      conversationId,
    } = req.body;

    const userId = req.user.id;

    if (!topic || topic.trim() === "") {
      return res.status(400).json({
        message: "Topic is required",
      });
    }

    if (!difficulty) {
      return res.status(400).json({
        message: "Difficulty is required",
      });
    }

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

    const prompt = `
Create a 5-day study plan for learning "${topic}"
at ${difficulty} level.

Requirements:
- Day-wise plan
- Clear tasks
- Beginner-friendly
- Include revision
- Include practice questions
`;

    const response =
      await generateWithRetry(prompt);

    await pool.query(
      `
      INSERT INTO study_history
      (
        user_id,
        conversation_id,
        topic,
        difficulty,
        content_type,
        content
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        userId,
        conversationId,
        topic,
        difficulty,
        "studyPlan",
        response.text,
      ]
    );

    res.json({
      studyPlan: response.text,
    });

  } catch (error) {
    console.error(
      "STUDY PLAN ERROR:"
    );
    console.error(error);

    if (error.status === 503) {
      return res.status(503).json({
        message:
          "AI service is busy right now. Please try again in a few moments.",
      });
    }

    res.status(500).json({
      message:
        "Study plan generation failed",
    });
  }
};


// =========================
// EXPORT CONTROLLERS
// =========================

module.exports = {
  explainTopic,
  generateNotes,
  generateQuiz,
  generateStudyPlan,
};