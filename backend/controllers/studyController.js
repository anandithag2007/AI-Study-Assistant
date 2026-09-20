const pool = require("../config/db");

const getStudyHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        id,
        topic,
        difficulty,
        content_type,
        created_at
      FROM study_history
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );

    res.json(result.rows);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch history",
    });
  }
};

module.exports = {
  getStudyHistory,
};