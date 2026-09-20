const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const aiRoutes =
  require("./routes/aiRoutes");
const studyRoutes =
  require("./routes/studyRoutes");  
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/study", studyRoutes);

app.use("/api/auth", authRoutes);
app.use(
  "/api/ai",
  aiRoutes
);
app.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT NOW()"
    );

    res.json({
      message: "AI Study Assistant Backend Running",
      database: "Connected",
      time: result.rows[0],
    });

  } catch (error) {
    res.status(500).json({
      message: "Database Connection Failed",
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});