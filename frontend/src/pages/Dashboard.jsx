import { useState } from "react";
import api from "../services/api";

function Dashboard() {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] =
    useState("Beginner");

  const [result, setResult] = useState("");
  const [notes, setNotes] = useState("");
  const [quiz, setQuiz] = useState("");
  const [studyPlan, setStudyPlan] =
  useState("");
  const [loading, setLoading] =
    useState(false);

  const handleExplain = async () => {
    try {
      setLoading(true);

      const response = await api.post(
        "/ai/explain",
        {
          topic,
          difficulty,
        }
      );

      setResult(
        response.data.explanation
      );

    } catch (error) {
      console.log(error);
      alert("AI Error");
    } finally {
      setLoading(false);
    }
  };

  const handleNotes = async () => {
    try {
      setLoading(true);

      const response = await api.post(
        "/ai/notes",
        {
          topic,
          difficulty,
        }
      );

      setNotes(
        response.data.notes
      );

    } catch (error) {
      console.log(error);
      alert("Notes Error");
    } finally {
      setLoading(false);
    }
  };
  const handleQuiz = async () => {
  try {
    setLoading(true);

    const response =
      await api.post(
        "/ai/quiz",
        {
          topic,
          difficulty,
        }
      );

    setQuiz(
      response.data.quiz
    );

  } catch (error) {
    console.log(error);
    alert("Quiz Error");
  } finally {
    setLoading(false);
  }
};

const handleStudyPlan = async () => {
  try {
    setLoading(true);

    const response =
      await api.post(
        "/ai/study-plan",
        {
          topic,
          difficulty,
        }
      );

    setStudyPlan(
      response.data.studyPlan
    );

  } catch (error) {
    console.log(error);
    alert("Study Plan Error");
  } finally {
    setLoading(false);
  }
};
  return (
    <div>
      <h1>AI Study Assistant</h1>

      <input
        type="text"
        placeholder="Enter topic"
        value={topic}
        onChange={(e) =>
          setTopic(e.target.value)
        }
      />

      <br />
      <br />

      <select
        value={difficulty}
        onChange={(e) =>
          setDifficulty(
            e.target.value
          )
        }
      >
        <option>Beginner</option>
        <option>Intermediate</option>
        <option>Advanced</option>
      </select>

      <br />
      <br />

      <div>
        <button
          onClick={handleExplain}
        >
          Generate Explanation
        </button>

        <button
          onClick={handleNotes}
        >
          Generate Notes
        </button>

        <button
          onClick={handleQuiz}
        >
          Generate Quiz
        </button>

        <button
          onClick={handleStudyPlan}
        >
          Generate Study Plan
        </button>
      </div>

      <hr />

      {loading ? (
        <p>Generating...</p>
      ) : (
        <>
          <h2>Explanation</h2>

          <pre>
            {result}
          </pre>

          <hr />

          <h2>Study Notes</h2>

          <pre>
            {notes}
          </pre>

          <hr />

          <h2>Quiz</h2>

          <pre>
            {quiz}
          </pre>

          <hr />

          <h2>Study Plan</h2>

          <pre>
            {studyPlan}
          </pre>
        </>
      )}
    </div>
  );
}

export default Dashboard;