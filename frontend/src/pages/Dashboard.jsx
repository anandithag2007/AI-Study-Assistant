import "./Dashboard.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Dashboard() {
  const navigate = useNavigate();

  // =========================
  // STUDY STATES
  // =========================

  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Beginner");

  const [result, setResult] = useState("");
  const [notes, setNotes] = useState("");
  const [quiz, setQuiz] = useState("");
  const [studyPlan, setStudyPlan] = useState("");

  // =========================
  // CHAT STATES
  // =========================

  const [chatMessages, setChatMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // =========================
  // HISTORY STATES
  // =========================

  const [history, setHistory] = useState([]);
  const [selectedContent, setSelectedContent] = useState(null);

  // =========================
  // CONVERSATION STATES
  // =========================

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] =
    useState(null);

  // =========================
  // GENERAL LOADING
  // =========================

  const [loading, setLoading] = useState(false);

  // =========================
  // FETCH STUDY HISTORY
  // =========================

  const fetchHistory = async () => {
    try {
      const response = await api.get("/study/history");

      setHistory(response.data);
    } catch (error) {
      console.log("FETCH HISTORY ERROR:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/");
      }
    }
  };

  // =========================
  // FETCH CONVERSATIONS
  // =========================

  const fetchConversations = async () => {
    try {
      const response = await api.get("/conversations");

      setConversations(response.data);
    } catch (error) {
      console.log(
        "FETCH CONVERSATIONS ERROR:",
        error
      );

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/");
      }
    }
  };

  // =========================
  // FETCH CHAT MESSAGES
  // =========================

  const fetchMessages = async (conversationId) => {
    try {
      const response = await api.get(
        `/chat/${conversationId}`
      );

      setChatMessages(response.data);

    } catch (error) {
      console.log(
        "FETCH CHAT MESSAGES ERROR:",
        error
      );
    }
  };

  // =========================
  // INITIAL LOAD
  // =========================

  useEffect(() => {
    fetchHistory();
    fetchConversations();
  }, []);

  // =========================
  // CLEAR CURRENT CONTENT
  // =========================

  const clearCurrentContent = () => {
    setResult("");
    setNotes("");
    setQuiz("");
    setStudyPlan("");

    setSelectedContent(null);

    setChatMessages([]);
    setChatMessage("");
  };

  // =========================
  // NEW CONVERSATION
  // =========================

  const handleNewConversation = () => {
    setSelectedConversation(null);

    clearCurrentContent();

    setTopic("");
    setDifficulty("Beginner");
  };

  // =========================
  // CREATE SMART TITLE
  // =========================

  const createConversationTitle = (text) => {
    if (!text || !text.trim()) {
      return "New Study";
    }

    let title = text.trim();

    // Difference between X and Y
    const differenceMatch = title.match(
      /difference\s+between\s+(.+?)\s+and\s+(.+?)(?:\?|\.|$)/i
    );

    if (differenceMatch) {
      const firstTopic =
        differenceMatch[1].trim();

      const secondTopic =
        differenceMatch[2].trim();

      return `${firstTopic} vs ${secondTopic}`;
    }

    // Remove polite phrases
    title = title.replace(
      /^(can you|could you|please|would you)\s+/i,
      ""
    );

    // Remove explanation phrases
    title = title.replace(
      /^(explain|tell me about|teach me about)\s+/i,
      ""
    );

    // Remove question phrases
    title = title.replace(
      /^(what is|what are|who is|who are|why is|why are|how does|how do|how can|how to)\s+/i,
      ""
    );

    // Remove request phrases
    title = title.replace(
      /^(give me|show me)\s+/i,
      ""
    );

    // Remove punctuation
    title = title
      .replace(/[?.!]+$/, "")
      .trim();

    // Remove common ending phrases
    title = title.replace(
      /\s+(in simple terms|in simple words|simply|with examples|and give me examples)$/i,
      ""
    );

    title = title.trim();

    if (!title) {
      title = text.trim();
    }

    // Capitalize first letter
    title =
      title.charAt(0).toUpperCase() +
      title.slice(1);

    // Limit title length
    if (title.length > 35) {
      title =
        title.substring(0, 35).trim() +
        "...";
    }

    return title;
  };

  // =========================
  // GET OR CREATE CONVERSATION
  // =========================

  const getOrCreateConversation = async (
    titleText
  ) => {
    // If already inside a conversation,
    // use the existing conversation.
    if (selectedConversation) {
      return selectedConversation;
    }

    const title =
      createConversationTitle(titleText);

    const response = await api.post(
      "/conversations",
      {
        title,
      }
    );

    const newConversation =
      response.data;

    setConversations((previous) => [
      newConversation,
      ...previous,
    ]);

    setSelectedConversation(
      newConversation
    );

    return newConversation;
  };

  // =========================
  // SELECT CONVERSATION
  // =========================

  const handleSelectConversation = async (
    conversation
  ) => {
    try {
      setSelectedConversation(
        conversation
      );

      clearCurrentContent();

      const response = await api.get(
        `/conversations/${conversation.id}`
      );

      const conversationData =
        response.data;

      const conversationHistory =
        conversationData.history || [];

      // Restore generated content
      conversationHistory.forEach((item) => {
        if (
          item.content_type ===
          "explanation"
        ) {
          setResult(item.content);
        }

        if (
          item.content_type === "notes"
        ) {
          setNotes(item.content);
        }

        if (
          item.content_type === "quiz"
        ) {
          setQuiz(item.content);
        }

        if (
          item.content_type ===
          "studyPlan"
        ) {
          setStudyPlan(item.content);
        }
      });

      // Restore topic from latest study item
      if (conversationHistory.length > 0) {
        const latestItem =
          conversationHistory[
            conversationHistory.length - 1
          ];

        setTopic(latestItem.topic || "");

        setDifficulty(
          latestItem.difficulty ||
            "Beginner"
        );
      }

      // Fetch chat messages
      await fetchMessages(
        conversation.id
      );

    } catch (error) {
      console.log(
        "SELECT CONVERSATION ERROR:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to open conversation."
      );
    }
  };

  // =========================
  // DELETE CONVERSATION
  // =========================

  const handleDeleteConversation = async (
    conversationId
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this conversation?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(
        `/conversations/${conversationId}`
      );

      setConversations((previous) =>
        previous.filter(
          (conversation) =>
            conversation.id !==
            conversationId
        )
      );

      if (
        selectedConversation?.id ===
        conversationId
      ) {
        handleNewConversation();
      }

    } catch (error) {
      console.log(
        "DELETE CONVERSATION ERROR:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to delete conversation."
      );
    }
  };

  // =========================
  // EXPLAIN TOPIC
  // =========================

  const handleExplain = async () => {
    if (!topic.trim()) {
      alert("Please enter a topic.");
      return;
    }

    try {
      setLoading(true);

      const conversation =
        await getOrCreateConversation(
          topic
        );

      const response = await api.post(
        "/ai/explain",
        {
          topic: topic.trim(),
          difficulty,
          conversationId:
            conversation.id,
        }
      );

      // IMPORTANT:
      // Backend returns { explanation: ... }
      setResult(
        response.data.explanation
      );

      setSelectedContent(
        "explanation"
      );

      await fetchConversations();
      await fetchHistory();

    } catch (error) {
      console.log(
        "EXPLAIN ERROR:",
        error
      );

      console.log(
        "EXPLAIN ERROR RESPONSE:",
        error.response?.data
      );

      alert(
        error.response?.data?.message ||
          "Failed to generate explanation."
      );

    } finally {
      setLoading(false);
    }
  };

  // =========================
  // GENERATE NOTES
  // =========================

  const handleNotes = async () => {
    if (!topic.trim()) {
      alert("Please enter a topic.");
      return;
    }

    try {
      setLoading(true);

      const conversation =
        await getOrCreateConversation(
          topic
        );

      const response = await api.post(
        "/ai/notes",
        {
          topic: topic.trim(),
          difficulty,
          conversationId:
            conversation.id,
        }
      );

      // IMPORTANT:
      // Backend returns { notes: ... }
      setNotes(
        response.data.notes
      );

      setSelectedContent("notes");

      await fetchConversations();
      await fetchHistory();

    } catch (error) {
      console.log(
        "NOTES ERROR:",
        error
      );

      console.log(
        "NOTES ERROR RESPONSE:",
        error.response?.data
      );

      alert(
        error.response?.data?.message ||
          "Failed to generate notes."
      );

    } finally {
      setLoading(false);
    }
  };

  // =========================
  // GENERATE QUIZ
  // =========================

  const handleQuiz = async () => {
    if (!topic.trim()) {
      alert("Please enter a topic.");
      return;
    }

    try {
      setLoading(true);

      const conversation =
        await getOrCreateConversation(
          topic
        );

      const response = await api.post(
        "/ai/quiz",
        {
          topic: topic.trim(),
          difficulty,
          conversationId:
            conversation.id,
        }
      );

      // IMPORTANT:
      // Backend returns { quiz: ... }
      setQuiz(
        response.data.quiz
      );

      setSelectedContent("quiz");

      await fetchConversations();
      await fetchHistory();

    } catch (error) {
      console.log(
        "QUIZ ERROR:",
        error
      );

      console.log(
        "QUIZ ERROR RESPONSE:",
        error.response?.data
      );

      alert(
        error.response?.data?.message ||
          "Failed to generate quiz."
      );

    } finally {
      setLoading(false);
    }
  };

  // =========================
  // GENERATE STUDY PLAN
  // =========================

  const handleStudyPlan = async () => {
    if (!topic.trim()) {
      alert("Please enter a topic.");
      return;
    }

    try {
      setLoading(true);

      const conversation =
        await getOrCreateConversation(
          topic
        );

      const response = await api.post(
        "/ai/study-plan",
        {
          topic: topic.trim(),
          difficulty,
          conversationId:
            conversation.id,
        }
      );

      // IMPORTANT:
      // Backend returns { studyPlan: ... }
      setStudyPlan(
        response.data.studyPlan
      );

      setSelectedContent(
        "studyPlan"
      );

      await fetchConversations();
      await fetchHistory();

    } catch (error) {
      console.log(
        "STUDY PLAN ERROR:",
        error
      );

      console.log(
        "STUDY PLAN ERROR RESPONSE:",
        error.response?.data
      );

      alert(
        error.response?.data?.message ||
          "Failed to generate study plan."
      );

    } finally {
      setLoading(false);
    }
  };

  // =========================
  // SEND CHAT MESSAGE
  // =========================

  const handleSendMessage = async (
    event
  ) => {
    if (event) {
      event.preventDefault();
    }

    const currentMessage =
      chatMessage.trim();

    if (!currentMessage) {
      return;
    }

    const temporaryMessageId =
      Date.now();

    try {
      setChatLoading(true);

      const conversation =
        await getOrCreateConversation(
          currentMessage
        );

      const temporaryUserMessage = {
        id: temporaryMessageId,
        role: "user",
        content: currentMessage,
      };

      setChatMessages(
        (previous) => [
          ...previous,
          temporaryUserMessage,
        ]
      );

      setChatMessage("");

      const response = await api.post(
        "/chat",
        {
          conversationId:
            conversation.id,
          message: currentMessage,
          difficulty,
        }
      );

      const assistantMessage = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content:
          response.data.message,
      };

      setChatMessages(
        (previous) => [
          ...previous,
          assistantMessage,
        ]
      );

      await fetchConversations();

    } catch (error) {
      console.log(
        "CHAT ERROR:",
        error
      );

      console.log(
        "CHAT ERROR RESPONSE:",
        error.response?.data
      );

      console.log(
        "CHAT ERROR STATUS:",
        error.response?.status
      );

      // Remove temporary user message
      setChatMessages(
        (previous) =>
          previous.filter(
            (message) =>
              message.id !==
              temporaryMessageId
          )
      );

      alert(
        error.response?.data?.message ||
          "Failed to send message."
      );

    } finally {
      setChatLoading(false);
    }
  };

  // =========================
  // VIEW HISTORY ITEM
  // =========================

  const handleViewHistory = (item) => {
    setSelectedContent(
      item.content_type
    );

    if (
      item.content_type ===
      "explanation"
    ) {
      setResult(item.content);
    }

    if (
      item.content_type === "notes"
    ) {
      setNotes(item.content);
    }

    if (
      item.content_type === "quiz"
    ) {
      setQuiz(item.content);
    }

    if (
      item.content_type ===
      "studyPlan"
    ) {
      setStudyPlan(item.content);
    }

    setTopic(item.topic || "");

    setDifficulty(
      item.difficulty || "Beginner"
    );
  };

  // =========================
  // DELETE HISTORY ITEM
  // =========================

  const handleDeleteHistory = async (
    historyId
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this history item?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(
        `/study/history/${historyId}`
      );

      setHistory((previous) =>
        previous.filter(
          (item) =>
            item.id !== historyId
        )
      );

    } catch (error) {
      console.log(
        "DELETE HISTORY ERROR:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to delete history item."
      );
    }
  };

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = () => {
    localStorage.removeItem("token");

    navigate("/");
  };

  // =========================
  // UI
  // =========================

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily:
          "Arial, sans-serif",
        backgroundColor: "#f5f7fb",
      }}
    >
      {/* =========================
          SIDEBAR
      ========================= */}

      <aside
        style={{
          width: "280px",
          backgroundColor: "#111827",
          color: "white",
          padding: "20px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: "20px",
          }}
        >
          AI Study Assistant
        </h2>

        {/* NEW STUDY */}

        <button
          onClick={
            handleNewConversation
          }
          style={{
            padding: "12px",
            border: "none",
            borderRadius: "8px",
            backgroundColor: "#2563eb",
            color: "white",
            cursor: "pointer",
            marginBottom: "20px",
            fontSize: "15px",
          }}
        >
          + New Study
        </button>

        {/* CONVERSATIONS */}

        <h3
          style={{
            fontSize: "14px",
            color: "#9ca3af",
            marginBottom: "10px",
          }}
        >
          Conversations
        </h3>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
          }}
        >
          {conversations.length ===
          0 ? (
            <p
              style={{
                color: "#9ca3af",
                fontSize: "14px",
              }}
            >
              No conversations yet.
            </p>
          ) : (
            conversations.map(
              (conversation) => (
                <div
                  key={
                    conversation.id
                  }
                  style={{
                    marginBottom:
                      "8px",
                  }}
                >
                  <button
                    onClick={() =>
                      handleSelectConversation(
                        conversation
                      )
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
                      textAlign: "left",
                      border: "none",
                      borderRadius:
                        "6px",
                      backgroundColor:
                        selectedConversation?.id ===
                        conversation.id
                          ? "#374151"
                          : "transparent",
                      color: "white",
                      cursor: "pointer",
                    }}
                  >
                    {conversation.title}
                  </button>

                  <button
                    onClick={() =>
                      handleDeleteConversation(
                        conversation.id
                      )
                    }
                    style={{
                      marginTop: "4px",
                      padding:
                        "5px 8px",
                      border: "none",
                      borderRadius:
                        "5px",
                      backgroundColor:
                        "#dc2626",
                      color: "white",
                      cursor: "pointer",
                      fontSize:
                        "12px",
                    }}
                  >
                    Delete
                  </button>
                </div>
              )
            )
          )}
        </div>

        {/* LOGOUT */}

        <button
          onClick={handleLogout}
          style={{
            marginTop: "20px",
            padding: "10px",
            border: "1px solid #6b7280",
            borderRadius: "8px",
            backgroundColor:
              "transparent",
            color: "white",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </aside>

      {/* =========================
          MAIN CONTENT
      ========================= */}

      <main
        style={{
          flex: 1,
          padding: "30px",
          boxSizing: "border-box",
          overflowY: "auto",
        }}
      >
        <h1>
          Study Dashboard
        </h1>

        <p
          style={{
            color: "#6b7280",
          }}
        >
          Learn, revise, and practice
          with your AI Study Assistant.
        </p>

        {/* =========================
            TOPIC INPUT
        ========================= */}

        <div
          style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "12px",
            marginTop: "20px",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "bold",
            }}
          >
            Topic
          </label>

          <input
            type="text"
            value={topic}
            onChange={(event) =>
              setTopic(
                event.target.value
              )
            }
            placeholder="Enter a topic..."
            style={{
              width: "100%",
              padding: "12px",
              boxSizing: "border-box",
              border:
                "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "15px",
            }}
          />

          <label
            style={{
              display: "block",
              marginTop: "15px",
              marginBottom: "8px",
              fontWeight: "bold",
            }}
          >
            Difficulty
          </label>

          <select
            value={difficulty}
            onChange={(event) =>
              setDifficulty(
                event.target.value
              )
            }
            style={{
              padding: "10px",
              border:
                "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "15px",
            }}
          >
            <option value="Beginner">
              Beginner
            </option>

            <option value="Intermediate">
              Intermediate
            </option>

            <option value="Advanced">
              Advanced
            </option>
          </select>

          {/* =========================
              AI ACTION BUTTONS
          ========================= */}

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              marginTop: "20px",
            }}
          >
            <button
              onClick={handleExplain}
              disabled={loading}
              style={{
                padding: "10px 15px",
                border: "none",
                borderRadius: "8px",
                backgroundColor:
                  "#2563eb",
                color: "white",
                cursor: loading
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {loading
                ? "Loading..."
                : "Explain Topic"}
            </button>

            <button
              onClick={handleNotes}
              disabled={loading}
              style={{
                padding: "10px 15px",
                border: "none",
                borderRadius: "8px",
                backgroundColor:
                  "#059669",
                color: "white",
                cursor: loading
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {loading
                ? "Loading..."
                : "Generate Notes"}
            </button>

            <button
              onClick={handleQuiz}
              disabled={loading}
              style={{
                padding: "10px 15px",
                border: "none",
                borderRadius: "8px",
                backgroundColor:
                  "#7c3aed",
                color: "white",
                cursor: loading
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {loading
                ? "Loading..."
                : "Generate Quiz"}
            </button>

            <button
              onClick={
                handleStudyPlan
              }
              disabled={loading}
              style={{
                padding: "10px 15px",
                border: "none",
                borderRadius: "8px",
                backgroundColor:
                  "#ea580c",
                color: "white",
                cursor: loading
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {loading
                ? "Loading..."
                : "Study Plan"}
            </button>
          </div>
        </div>

        {/* =========================
            CHAT
        ========================= */}

        <div
          style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "12px",
            marginTop: "20px",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <h2>AI Chat</h2>

          <div
            style={{
              maxHeight: "400px",
              overflowY: "auto",
              marginBottom: "15px",
            }}
          >
            {chatMessages.length ===
            0 ? (
              <p
                style={{
                  color: "#6b7280",
                }}
              >
                Ask anything about
                your studies.
              </p>
            ) : (
              chatMessages.map(
                (message) => (
                  <div
                    key={message.id}
                    style={{
                      marginBottom:
                        "12px",
                      padding: "12px",
                      borderRadius:
                        "8px",
                      backgroundColor:
                        message.role ===
                        "user"
                          ? "#dbeafe"
                          : "#f3f4f6",
                    }}
                  >
                    <strong>
                      {message.role ===
                      "user"
                        ? "You"
                        : "AI"}
                    </strong>

                    <p
                      style={{
                        whiteSpace:
                          "pre-wrap",
                        marginBottom: 0,
                      }}
                    >
                      {
                        message.content
                      }
                    </p>
                  </div>
                )
              )
            )}

            {chatLoading && (
              <p
                style={{
                  color: "#6b7280",
                }}
              >
                AI is thinking...
              </p>
            )}
          </div>

          <form
            onSubmit={
              handleSendMessage
            }
            style={{
              display: "flex",
              gap: "10px",
            }}
          >
            <input
              type="text"
              value={chatMessage}
              onChange={(event) =>
                setChatMessage(
                  event.target.value
                )
              }
              placeholder="Ask a question..."
              style={{
                flex: 1,
                padding: "12px",
                border:
                  "1px solid #d1d5db",
                borderRadius: "8px",
              }}
            />

            <button
              type="submit"
              disabled={chatLoading}
              style={{
                padding:
                  "10px 18px",
                border: "none",
                borderRadius: "8px",
                backgroundColor:
                  "#2563eb",
                color: "white",
                cursor:
                  chatLoading
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              Send
            </button>
          </form>
        </div>

        {/* =========================
            GENERATED EXPLANATION
        ========================= */}

        {result && (
          <div
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "12px",
              marginTop: "20px",
              boxShadow:
                "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <h2>
              Explanation
            </h2>

            <div
              style={{
                whiteSpace:
                  "pre-wrap",
              }}
            >
              {result}
            </div>
          </div>
        )}

        {/* =========================
            GENERATED NOTES
        ========================= */}

        {notes && (
          <div
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "12px",
              marginTop: "20px",
              boxShadow:
                "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <h2>
              Study Notes
            </h2>

            <div
              style={{
                whiteSpace:
                  "pre-wrap",
              }}
            >
              {notes}
            </div>
          </div>
        )}

        {/* =========================
            GENERATED QUIZ
        ========================= */}

        {quiz && (
          <div
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "12px",
              marginTop: "20px",
              boxShadow:
                "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <h2>
              Quiz
            </h2>

            <div
              style={{
                whiteSpace:
                  "pre-wrap",
              }}
            >
              {quiz}
            </div>
          </div>
        )}

        {/* =========================
            GENERATED STUDY PLAN
        ========================= */}

        {studyPlan && (
          <div
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "12px",
              marginTop: "20px",
              boxShadow:
                "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <h2>
              Study Plan
            </h2>

            <div
              style={{
                whiteSpace:
                  "pre-wrap",
              }}
            >
              {studyPlan}
            </div>
          </div>
        )}

        {/* =========================
            STUDY HISTORY
        ========================= */}

        <div
          style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "12px",
            marginTop: "20px",
            marginBottom: "30px",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <h2>
            Study History
          </h2>

          {history.length === 0 ? (
            <p
              style={{
                color: "#6b7280",
              }}
            >
              No study history yet.
            </p>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: "15px",
                  border:
                    "1px solid #e5e7eb",
                  borderRadius: "8px",
                  marginBottom:
                    "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    gap: "10px",
                  }}
                >
                  <div>
                    <strong>
                      {item.topic}
                    </strong>

                    <p
                      style={{
                        margin:
                          "5px 0",
                        color:
                          "#6b7280",
                        fontSize:
                          "14px",
                      }}
                    >
                      {item.content_type}{" "}
                      •{" "}
                      {item.difficulty}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                    }}
                  >
                    <button
                      onClick={() =>
                        handleViewHistory(
                          item
                        )
                      }
                      style={{
                        padding:
                          "7px 10px",
                        border: "none",
                        borderRadius:
                          "6px",
                        backgroundColor:
                          "#2563eb",
                        color:
                          "white",
                        cursor:
                          "pointer",
                      }}
                    >
                      View
                    </button>

                    <button
                      onClick={() =>
                        handleDeleteHistory(
                          item.id
                        )
                      }
                      style={{
                        padding:
                          "7px 10px",
                        border: "none",
                        borderRadius:
                          "6px",
                        backgroundColor:
                          "#dc2626",
                        color:
                          "white",
                        cursor:
                          "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;