import "./Dashboard.css";

import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import api from "../services/api";

function Dashboard() {
  const navigate = useNavigate();

  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Beginner");

  const [result, setResult] = useState("");
  const [notes, setNotes] = useState("");
  const [quiz, setQuiz] = useState("");
  const [studyPlan, setStudyPlan] = useState("");

  const [chatMessages, setChatMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const [selectedContent, setSelectedContent] = useState(null);

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] =
    useState(null);

  // Stores which AI tool is currently generating.
  // null = no AI tool is generating.
  const [loading, setLoading] = useState(null);

  // Mobile sidebar drawer
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Conversation delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);

  // FETCH CONVERSATIONS
  const fetchConversations = async () => {
    try {
      const response = await api.get("/conversations");
      setConversations(response.data || []);
    } catch (error) {
      console.error(
        "Failed to fetch conversations:",
        error
      );
    }
  };

  // FETCH CHAT MESSAGES
  const fetchMessages = async (conversationId) => {
    try {
      const response = await api.get(
        `/chat/${conversationId}`
      );

      setChatMessages(response.data || []);
    } catch (error) {
      console.error(
        "Failed to fetch chat messages:",
        error
      );

      setChatMessages([]);
    }
  };

  useEffect(() => {
  const loadConversations = async () => {
    try {
      const response = await api.get("/conversations");
      setConversations(response.data || []);
    } catch (error) {
      console.error(
        "Failed to fetch conversations:",
        error
      );
    }
  };

  loadConversations();
}, []);

  // CLEAR CURRENT STUDY CONTENT
  const clearCurrentContent = () => {
    setResult("");
    setNotes("");
    setQuiz("");
    setStudyPlan("");
    setSelectedContent(null);
    setChatMessages([]);
    setChatMessage("");
  };

  // NEW STUDY
  const handleNewConversation = () => {
    setSelectedConversation(null);
    setTopic("");
    setDifficulty("Beginner");

    clearCurrentContent();

    setSidebarOpen(false);
  };

  // CREATE SMART CONVERSATION TITLE
  const createConversationTitle = (text) => {
    let title = text.trim();

    if (!title) {
      return "New Study";
    }

    title = title
      .replace(
        /^(can you|could you|please|help me|tell me|explain)\s+/i,
        ""
      )
      .replace(/[?!.]+$/, "")
      .trim();

    const comparisonMatch = title.match(
      /^difference between (.+?) and (.+)$/i
    );

    if (comparisonMatch) {
      title = `${comparisonMatch[1]} vs ${comparisonMatch[2]}`;
    }

    if (title.length > 35) {
      title = `${title.substring(0, 32).trim()}...`;
    }

    return (
      title.charAt(0).toUpperCase() +
      title.slice(1)
    );
  };

  // GET OR CREATE CONVERSATION
  const getOrCreateConversation = async (titleText) => {
    if (selectedConversation) {
      return selectedConversation;
    }

    try {
      const response = await api.post(
        "/conversations",
        {
          title: createConversationTitle(titleText),
        }
      );

      const newConversation = response.data;

      setSelectedConversation(newConversation);

      setConversations((previous) => [
        newConversation,
        ...previous,
      ]);

      return newConversation;
    } catch (error) {
      console.error(
        "Failed to create conversation:",
        error
      );

      throw error;
    }
  };

  // SELECT CONVERSATION
  const handleSelectConversation = async (
    conversation
  ) => {
    try {
      setSelectedConversation(conversation);

      setTopic("");
      setDifficulty("Beginner");

      clearCurrentContent();

      setSidebarOpen(false);

      // Get saved study content for this conversation
      const response = await api.get(
        `/conversations/${conversation.id}`
      );

      const conversationData = response.data;

      if (
        conversationData.history &&
        conversationData.history.length > 0
      ) {
        const history =
          conversationData.history;

        // Restore the latest topic and difficulty
        const latestHistory =
          history[history.length - 1];

        setTopic(
          latestHistory.topic || ""
        );

        setDifficulty(
          latestHistory.difficulty ||
            "Beginner"
        );

        // Restore ALL generated study content
        history.forEach((item) => {
          // Backend property is content_type
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

          // Backend stores Study Plan as "studyPlan"
          if (
            item.content_type ===
            "studyPlan"
          ) {
            setStudyPlan(item.content);
          }
        });
      }

      // Restore AI chat messages
      await fetchMessages(
        conversation.id
      );
    } catch (error) {
      console.error(
        "Failed to load conversation:",
        error
      );
    }
  };

  // DELETE CONVERSATION
  const handleDeleteConversation = async (
    conversationId
  ) => {
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
        setSelectedConversation(null);
        setTopic("");
        setDifficulty("Beginner");

        clearCurrentContent();
      }

      setDeleteTarget(null);
    } catch (error) {
      console.error(
        "Failed to delete conversation:",
        error
      );

      alert(
        "Failed to delete conversation."
      );
    }
  };

  // EXPLAIN TOPIC
  const handleExplain = async () => {
    if (!topic.trim()) {
      alert(
        "Please enter a topic first."
      );

      return;
    }

    try {
      // Only Explain Topic becomes Loading...
      setLoading("explain");

      const conversation =
        await getOrCreateConversation(
          topic
        );

      const response = await api.post(
        "/ai/explain",
        {
          topic,
          difficulty,
          conversationId:
            conversation.id,
        }
      );

      setResult(
        response.data.explanation
      );

      setSelectedContent(
        "explanation"
      );

      await fetchConversations();
    } catch (error) {
      console.error(
        "Explain error:",
        error
      );

      alert(
        error.response?.data
          ?.message ||
          "Something went wrong while generating the explanation."
      );
    } finally {
      setLoading(null);
    }
  };

  // GENERATE NOTES
  const handleNotes = async () => {
    if (!topic.trim()) {
      alert(
        "Please enter a topic first."
      );

      return;
    }

    try {
      // Only Generate Notes becomes Loading...
      setLoading("notes");

      const conversation =
        await getOrCreateConversation(
          topic
        );

      const response = await api.post(
        "/ai/notes",
        {
          topic,
          difficulty,
          conversationId:
            conversation.id,
        }
      );

      setNotes(
        response.data.notes
      );

      setSelectedContent("notes");

      await fetchConversations();
    } catch (error) {
      console.error(
        "Notes error:",
        error
      );

      alert(
        error.response?.data
          ?.message ||
          "Something went wrong while generating notes."
      );
    } finally {
      setLoading(null);
    }
  };

  // GENERATE QUIZ
  const handleQuiz = async () => {
    if (!topic.trim()) {
      alert(
        "Please enter a topic first."
      );

      return;
    }

    try {
      // Only Generate Quiz becomes Loading...
      setLoading("quiz");

      const conversation =
        await getOrCreateConversation(
          topic
        );

      const response = await api.post(
        "/ai/quiz",
        {
          topic,
          difficulty,
          conversationId:
            conversation.id,
        }
      );

      setQuiz(
        response.data.quiz
      );

      setSelectedContent("quiz");

      await fetchConversations();
    } catch (error) {
      console.error(
        "Quiz error:",
        error
      );

      alert(
        error.response?.data
          ?.message ||
          "Something went wrong while generating the quiz."
      );
    } finally {
      setLoading(null);
    }
  };

  // GENERATE STUDY PLAN
  const handleStudyPlan = async () => {
    if (!topic.trim()) {
      alert(
        "Please enter a topic first."
      );

      return;
    }

    try {
      // Only Study Plan becomes Loading...
      setLoading("studyPlan");

      const conversation =
        await getOrCreateConversation(
          topic
        );

      const response = await api.post(
        "/ai/study-plan",
        {
          topic,
          difficulty,
          conversationId:
            conversation.id,
        }
      );

      setStudyPlan(
        response.data.studyPlan
      );

      setSelectedContent(
        "studyPlan"
      );

      await fetchConversations();
    } catch (error) {
      console.error(
        "Study plan error:",
        error
      );

      alert(
        error.response?.data
          ?.message ||
          "Something went wrong while generating the study plan."
      );
    } finally {
      setLoading(null);
    }
  };

  // SEND CHAT MESSAGE
  const handleSendMessage = async (
    event
  ) => {
    event.preventDefault();

    if (
      !chatMessage.trim() ||
      chatLoading
    ) {
      return;
    }

    const messageText =
      chatMessage.trim();

    try {
      setChatLoading(true);

      const conversation =
        await getOrCreateConversation(
          messageText
        );

      const temporaryMessage = {
        id: `temp-${Date.now()}`,
        role: "user",
        content: messageText,
      };

      setChatMessages((previous) => [
        ...previous,
        temporaryMessage,
      ]);

      setChatMessage("");

      const response = await api.post(
        "/chat",
        {
          conversationId:
            conversation.id,
          message: messageText,
        }
      );

      const assistantMessage = {
        id:
          response.data.id ||
          `assistant-${Date.now()}`,

        role: "assistant",

        content:
          response.data.response ||
          response.data.message,
      };

      setChatMessages((previous) => [
        ...previous,
        assistantMessage,
      ]);

      await fetchConversations();
    } catch (error) {
      console.error(
        "Chat error:",
        error
      );

      setChatMessages((previous) =>
        previous.filter(
          (message) =>
            !String(
              message.id
            ).startsWith("temp-")
        )
      );

      alert(
        error.response?.data
          ?.message ||
          "Something went wrong while sending your message."
      );
    } finally {
      setChatLoading(false);
    }
  };

  // LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("token");

    navigate("/");
  };

  // FORMAT INLINE MARKDOWN
  // FORMAT INLINE MARKDOWN
const formatInlineText = (text) => {
  const parts = [];

  let remaining = text;

  const markdownRegex =
    /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/;

  while (remaining.length > 0) {
    const match =
      remaining.match(markdownRegex);

    if (!match) {
      parts.push(
        <span key={parts.length}>
          {remaining}
        </span>
      );

      break;
    }

    const matchIndex =
      match.index;

    if (matchIndex > 0) {
      parts.push(
        <span key={parts.length}>
          {remaining.substring(
            0,
            matchIndex
          )}
        </span>
      );
    }

    if (
      match[1].startsWith("**")
    ) {
      parts.push(
        <strong key={parts.length}>
          {match[2]}
        </strong>
      );
    } else if (
      match[1].startsWith("*")
    ) {
      parts.push(
        <em key={parts.length}>
          {match[3]}
        </em>
      );
    } else if (
      match[1].startsWith("`")
    ) {
      parts.push(
        <code
          key={parts.length}
          className="inline-code"
        >
          {match[4]}
        </code>
      );
    }

    remaining =
      remaining.substring(
        matchIndex +
          match[0].length
      );
  }

  return parts;
};

  // FORMAT AI CONTENT
  const formatAIContent = (
    content
  ) => {
    if (!content) {
      return null;
    }

    const lines =
      content.split("\n");

    return lines.map(
      (line, index) => {
        const trimmedLine =
          line.trim();

        if (!trimmedLine) {
          return (
            <div
              key={index}
              className="content-space"
            />
          );
        }

        if (
          trimmedLine.startsWith(
            "# "
          )
        ) {
          return (
            <h2
              key={index}
              className="content-heading-main"
            >
              {formatInlineText(
                trimmedLine.replace(
                  /^#\s+/,
                  ""
                )
              )}
            </h2>
          );
        }

        if (
          trimmedLine.startsWith(
            "## "
          )
        ) {
          return (
            <h3
              key={index}
              className="content-heading"
            >
              {formatInlineText(
                trimmedLine.replace(
                  /^##\s+/,
                  ""
                )
              )}
            </h3>
          );
        }

        if (
          trimmedLine.startsWith(
            "### "
          )
        ) {
          return (
            <h4
              key={index}
              className="content-heading-small"
            >
              {formatInlineText(
                trimmedLine.replace(
                  /^###\s+/,
                  ""
                )
              )}
            </h4>
          );
        }

        if (
          /^[-*•]\s+/.test(
            trimmedLine
          )
        ) {
          return (
            <div
              key={index}
              className="content-bullet"
            >
              <span className="bullet-dot">
                •
              </span>

              <span>
                {formatInlineText(
                  trimmedLine.replace(
                    /^[-*•]\s+/,
                    ""
                  )
                )}
              </span>
            </div>
          );
        }

        const numberedMatch =
          trimmedLine.match(
            /^(\d+)[.)]\s+(.*)$/
          );

        if (numberedMatch) {
          return (
            <div
              key={index}
              className="content-numbered"
            >
              <span className="number-badge">
                {numberedMatch[1]}
              </span>

              <span>
                {formatInlineText(
                  numberedMatch[2]
                )}
              </span>
            </div>
          );
        }

        return (
          <p
            key={index}
            className="content-paragraph"
          >
            {formatInlineText(
              trimmedLine
            )}
          </p>
        );
      }
    );
  };

  return (
    <div className="dashboard-shell">
      {sidebarOpen && (
        <button
          className="sidebar-overlay"
          onClick={() =>
            setSidebarOpen(false)
          }
          aria-label="Close navigation"
        />
      )}

      <aside
        className={`sidebar ${
          sidebarOpen
            ? "sidebar-open"
            : ""
        }`}
      >
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <div className="brand-icon">
              AI
            </div>

            <div className="brand-text">
              <h2>
                AI Study Assistant
              </h2>

              <span>
                Your personal study
                space
              </span>
            </div>

            <button
              className="sidebar-close"
              onClick={() =>
                setSidebarOpen(false)
              }
              aria-label="Close sidebar"
            >
              ×
            </button>
          </div>

          <button
            className="new-study-button"
            onClick={
              handleNewConversation
            }
            disabled={
              loading !== null ||
              chatLoading
            }
          >
            <span className="new-study-icon">
              +
            </span>

            <span>New Study</span>
          </button>

          <div className="conversation-section">
            <div className="section-label">
              Conversations
            </div>

            <div className="conversation-list">
              {conversations.length ===
              0 ? (
                <div className="empty-conversations">
                  <div className="empty-icon">
                    💬
                  </div>

                  <p>
                    No conversations
                    yet.
                  </p>

                  <span>
                    Start a study
                    session to see it
                    here.
                  </span>
                </div>
              ) : (
                conversations.map(
                  (conversation) => (
                    <div
                      key={
                        conversation.id
                      }
                      className={`conversation-item ${
                        selectedConversation?.id ===
                        conversation.id
                          ? "active"
                          : ""
                      }`}
                      onContextMenu={(
                        event
                      ) => {
                        event.preventDefault();

                        setDeleteTarget(
                          conversation
                        );
                      }}
                    >
                      <button
                        className="conversation-button"
                        onClick={() =>
                          handleSelectConversation(
                            conversation
                          )
                        }
                        disabled={
                          loading !==
                            null ||
                          chatLoading
                        }
                      >
                        <span className="conversation-icon">
                          ▸
                        </span>

                        <span className="conversation-title">
                          {
                            conversation.title
                          }
                        </span>
                      </button>

                      <button
                        className="conversation-delete"
                        onClick={(
                          event
                        ) => {
                          event.stopPropagation();

                          setDeleteTarget(
                            conversation
                          );
                        }}
                        title="Delete conversation"
                        aria-label={`Delete ${conversation.title}`}
                      >
                        ×
                      </button>
                    </div>
                  )
                )
              )}
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          <button
            className="logout-button"
            onClick={
              handleLogout
            }
          >
            <span>↪</span>
            Logout
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-content">
          <div className="mobile-topbar">
            <button
              className="menu-button"
              onClick={() =>
                setSidebarOpen(true)
              }
              aria-label="Open conversations"
            >
              ☰
            </button>

            <div className="mobile-brand">
              <div className="mobile-brand-icon">
                AI
              </div>

              <span>
                AI Study Assistant
              </span>
            </div>
          </div>

          <header className="dashboard-header">
            <div className="welcome-label">
              YOUR STUDY SPACE
            </div>

            <h1>
              {selectedConversation
                ? selectedConversation.title
                : "Study Dashboard"}
            </h1>

            <p>
              Learn, revise, and
              practice with your AI
              Study Assistant.
            </p>
          </header>

          <section className="study-card">
            <div className="card-heading">
              <div className="card-heading-icon">
                ✦
              </div>

              <div>
                <h2>
                  What are you
                  studying?
                </h2>

                <p>
                  Choose a topic and
                  let your AI assistant
                  help you learn.
                </p>
              </div>
            </div>

            <div className="study-form">
              <div className="form-group topic-group">
                <label htmlFor="study-topic">
                  Topic
                </label>

                <input
                  id="study-topic"
                  type="text"
                  value={topic}
                  onChange={(event) =>
                    setTopic(
                      event.target
                        .value
                    )
                  }
                  placeholder="e.g. Operating Systems, React, DBMS..."
                  disabled={
                    loading !== null
                  }
                />
              </div>

              <div className="form-group">
                <label htmlFor="study-difficulty">
                  Difficulty
                </label>

                <select
                  id="study-difficulty"
                  value={difficulty}
                  onChange={(event) =>
                    setDifficulty(
                      event.target
                        .value
                    )
                  }
                  disabled={
                    loading !== null
                  }
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
              </div>
            </div>

            <div className="ai-actions">
              <button
                className="ai-action primary"
                onClick={
                  handleExplain
                }
                disabled={
                  loading !== null
                }
              >
                <span className="action-icon">
                  ✦
                </span>

                {loading ===
                "explain"
                  ? "Loading..."
                  : "Explain Topic"}
              </button>

              <button
                className="ai-action green"
                onClick={
                  handleNotes
                }
                disabled={
                  loading !== null
                }
              >
                <span className="action-icon">
                  ▤
                </span>

                {loading === "notes"
                  ? "Loading..."
                  : "Generate Notes"}
              </button>

              <button
                className="ai-action purple"
                onClick={
                  handleQuiz
                }
                disabled={
                  loading !== null
                }
              >
                <span className="action-icon">
                  ✓
                </span>

                {loading === "quiz"
                  ? "Loading..."
                  : "Generate Quiz"}
              </button>

              <button
                className="ai-action orange"
                onClick={
                  handleStudyPlan
                }
                disabled={
                  loading !== null
                }
              >
                <span className="action-icon">
                  ◫
                </span>

                {loading ===
                "studyPlan"
                  ? "Loading..."
                  : "Study Plan"}
              </button>
            </div>
          </section>

          <section className="chat-card">
            <div className="chat-header">
              <div className="chat-title-wrapper">
                <div className="chat-icon">
                  AI
                </div>

                <div>
                  <h2>AI Chat</h2>

                  <p>
                    Ask follow-up
                    questions about
                    what you're
                    learning.
                  </p>
                </div>
              </div>

              <div className="chat-status">
                <span className="status-dot"></span>
                AI Assistant
              </div>
            </div>

            <div className="chat-messages">
              {chatMessages.length ===
              0 ? (
                <div className="chat-empty">
                  <div className="chat-empty-icon">
                    ✦
                  </div>

                  <h3>
                    Start a
                    conversation
                  </h3>

                  <p>
                    Ask a question about
                    your topic, request
                    an example, or clear
                    up something you find
                    difficult.
                  </p>
                </div>
              ) : (
                chatMessages.map(
                  (message) => (
                    <div
                      key={
                        message.id
                      }
                      className={`chat-message ${
                        message.role ===
                        "user"
                          ? "user-message"
                          : "assistant-message"
                      }`}
                    >
                      <div className="message-avatar">
                        {message.role ===
                        "user"
                          ? "YOU"
                          : "AI"}
                      </div>

                      <div className="message-body">
                        <div className="message-name">
                          {message.role ===
                          "user"
                            ? "You"
                            : "AI Assistant"}
                        </div>

                        <div className="message-content">
                          {message.role ===
                          "assistant"
                            ? formatAIContent(
                                message.content
                              )
                            : message.content}
                        </div>
                      </div>
                    </div>
                  )
                )
              )}

              {chatLoading && (
                <div className="chat-message assistant-message">
                  <div className="message-avatar">
                    AI
                  </div>

                  <div className="message-body">
                    <div className="message-name">
                      AI Assistant
                    </div>

                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <form
              className="chat-input-wrapper"
              onSubmit={
                handleSendMessage
              }
            >
              <input
                type="text"
                value={chatMessage}
                onChange={(event) =>
                  setChatMessage(
                    event.target.value
                  )
                }
                placeholder="Ask a question about your studies..."
                disabled={
                  loading !== null
                }
              />

              <button
                className="send-button"
                type="submit"
                disabled={
                  chatLoading ||
                  loading !== null ||
                  !chatMessage.trim()
                }
              >
                <span>Send</span>
                <span>➤</span>
              </button>
            </form>
          </section>

          {result && (
            <section
              className={`content-card ${
                selectedContent ===
                "explanation"
                  ? "selected-content"
                  : ""
              }`}
            >
              <div className="content-card-header">
                <div className="content-icon explanation-icon">
                  ✦
                </div>

                <div>
                  <span className="content-label">
                    LEARN
                  </span>

                  <h2>
                    Explanation
                  </h2>
                </div>
              </div>

              <div className="content-body">
                {formatAIContent(
                  result
                )}
              </div>
            </section>
          )}

          {notes && (
            <section
              className={`content-card ${
                selectedContent ===
                "notes"
                  ? "selected-content"
                  : ""
              }`}
            >
              <div className="content-card-header">
                <div className="content-icon notes-icon">
                  ▤
                </div>

                <div>
                  <span className="content-label">
                    REVISE
                  </span>

                  <h2>
                    Study Notes
                  </h2>
                </div>
              </div>

              <div className="content-body">
                {formatAIContent(
                  notes
                )}
              </div>
            </section>
          )}

          {quiz && (
            <section
              className={`content-card ${
                selectedContent ===
                "quiz"
                  ? "selected-content"
                  : ""
              }`}
            >
              <div className="content-card-header">
                <div className="content-icon quiz-icon">
                  ✓
                </div>

                <div>
                  <span className="content-label">
                    PRACTICE
                  </span>

                  <h2>Quiz</h2>
                </div>
              </div>

              <div className="content-body">
                {formatAIContent(
                  quiz
                )}
              </div>
            </section>
          )}

          {studyPlan && (
            <section
              className={`content-card ${
                selectedContent ===
                "studyPlan"
                  ? "selected-content"
                  : ""
              }`}
            >
              <div className="content-card-header">
                <div className="content-icon plan-icon">
                  ◫
                </div>

                <div>
                  <span className="content-label">
                    PLAN
                  </span>

                  <h2>
                    Study Plan
                  </h2>
                </div>
              </div>

              <div className="content-body">
                {formatAIContent(
                  studyPlan
                )}
              </div>
            </section>
          )}
        </div>
      </main>

      {deleteTarget && (
        <div
          className="delete-modal-overlay"
          onClick={() =>
            setDeleteTarget(null)
          }
        >
          <div
            className="delete-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="delete-modal-icon">
              ×
            </div>

            <h3>
              Delete conversation?
            </h3>

            <p>
              Are you sure you want to
              delete{" "}
              <strong>
                {deleteTarget.title}
              </strong>
              ? This action cannot be
              undone.
            </p>

            <div className="delete-modal-actions">
              <button
                className="delete-cancel-button"
                onClick={() =>
                  setDeleteTarget(null)
                }
              >
                Cancel
              </button>

              <button
                className="delete-confirm-button"
                onClick={() =>
                  handleDeleteConversation(
                    deleteTarget.id
                  )
                }
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;