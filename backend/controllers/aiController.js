const { GoogleGenAI } = require("@google/genai");
const pool = require("../config/db");
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const explainTopic = async (req, res) => {
  try {
    const { topic, difficulty } = req.body;

const userId = req.user.id;

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
  await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt,
  });

await pool.query(
  `INSERT INTO study_history
  (user_id, topic, difficulty, content_type, content)
  VALUES ($1, $2, $3, $4, $5)`,
  [
    userId,
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

const generateNotes = async (req, res) => {
  try {
    const { topic, difficulty } = req.body;

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
  await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt,
  });

await pool.query(
  `INSERT INTO study_history
  (user_id, topic, difficulty, content_type, content)
  VALUES ($1, $2, $3, $4, $5)`,
  [
    userId,
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
    console.error(error);

    res.status(500).json({
      message: "Notes generation failed",
    });
  }
};

const generateQuiz = async (req, res) => {
  try {
    const { topic, difficulty } = req.body;

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
...

Do not include explanations.
`;

    const response =
      await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
      });

    await pool.query(
  `INSERT INTO study_history
  (topic, difficulty, content_type, content)
  VALUES ($1, $2, $3, $4)`,
  [
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
    console.error(error);

    res.status(500).json({
      message: "Quiz generation failed",
    });
  }
};

const generateStudyPlan = async (req, res) => {
  try {
    const { topic, difficulty } = req.body;

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
      await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
      });

    await pool.query(
  `INSERT INTO study_history
  (topic, difficulty, content_type, content)
  VALUES ($1, $2, $3, $4)`,
  [
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
  console.error("STUDY PLAN ERROR:");
  console.error(error);

  res.status(500).json({
    message: error.message,
  });
}
};

module.exports = {
  explainTopic,
  generateNotes,
  generateQuiz,
  generateStudyPlan,
};
