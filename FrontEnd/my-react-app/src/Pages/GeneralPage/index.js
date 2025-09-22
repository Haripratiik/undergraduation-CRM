import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./styles.css"; // new CSS file

export const GeneralPage = () => {
  const navigate = useNavigate();
  const [generalStats, setGeneralStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  const [fadeStats, setFadeStats] = useState(false);
  const [fadeLeaderboard, setFadeLeaderboard] = useState(false);

  const API_BASE = "http://localhost:8000";

  const fetchGeneralStats = async () => {
    try {
      setLoadingStats(true);
      const res = await axios.get(`${API_BASE}/generalStats`);
      setFadeStats(true);
      setGeneralStats(res.data);
      setTimeout(() => setFadeStats(false), 500);
    } catch (err) {
      console.error("Failed to fetch general stats:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      setLoadingLeaderboard(true);
      const res = await axios.get(`${API_BASE}/leaderboard`);
      setFadeLeaderboard(true);
      setLeaderboard(res.data.leaderboard);
      setTimeout(() => setFadeLeaderboard(false), 500);
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    fetchGeneralStats();
    fetchLeaderboard();

    const interval = setInterval(() => {
      fetchGeneralStats();
      fetchLeaderboard();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="general-page">
      {/* Back button styled like AdminDashboard */}
      <button className="back-button" onClick={() => navigate("/adminDashboard")}>
        &larr; Back to Dashboard
      </button>

      <h1>General Statistics</h1>

      <div className={`stats-section ${fadeStats ? "fade" : ""}`}>
        {loadingStats ? (
          <p>Loading general stats...</p>
        ) : generalStats ? (
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Students</h3>
              <p>{generalStats.totalStudents}</p>
            </div>
            <div className="stat-card">
              <h3>Exploring</h3>
              <p>{generalStats.exploring}</p>
            </div>
            <div className="stat-card">
              <h3>Shortlisting</h3>
              <p>{generalStats.shortlisting}</p>
            </div>
            <div className="stat-card">
              <h3>Applying</h3>
              <p>{generalStats.applying}</p>
            </div>
            <div className="stat-card">
              <h3>Submitted</h3>
              <p>{generalStats.submitted}</p>
            </div>
            <div className="stat-card alert">
              <h3>Inactive 7+ Days</h3>
              <p>{generalStats.inactive7Days}</p>
            </div>
          </div>
        ) : (
          <p>No stats available.</p>
        )}
      </div>

      <h2>Leaderboard</h2>
      <div className={`leaderboard-section ${fadeLeaderboard ? "fade" : ""}`}>
        {loadingLeaderboard ? (
          <p>Loading leaderboard...</p>
        ) : leaderboard.length > 0 ? (
          // Olympic podium style for top 3
          <div className="podium-container">
            {leaderboard.slice(0, 3).map((admin, index) => (
              <div key={index} className={`podium podium-${index + 1}`}>
                <div className="podium-rank">{index + 1}</div>
                <div className="podium-score">Score: {admin.score}</div>
              </div>
            ))}
          </div>
        ) : (
          <p>No leaderboard data available.</p>
        )}
      </div>
    </div>
  );
};
