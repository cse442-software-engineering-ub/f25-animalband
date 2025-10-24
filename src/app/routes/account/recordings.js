import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./recordings.css";
import "./desktop_edit_account.css"; // reuse shared layout + header + sidebar styles

const PHP_URL =
  "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/shabad/php";

export default function MyRecordings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [recordings, setRecordings] = useState([]);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const audioContextRef = useRef(null);

  // Load user info for header
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${PHP_URL}/getUser.php`, {
          credentials: "include",
        });
        const text = await res.text();
        const data = JSON.parse(text);
        if (!data.loggedIn) {
          navigate("/login");
          return;
        }
        setUser(data);
      } catch (e) {
        console.error("Error loading user:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  // Initialize AudioContext
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
    }
  }, []);

  // Fetch recordings
  useEffect(() => {
    const fetchRecordings = async () => {
      const cookies = document.cookie.split("; ");
      const cookieObj = Object.fromEntries(cookies.map((c) => c.split("=")));
      const authCookie = cookieObj["auth_token"] || "";
      try {
        const response = await fetch(
          "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/saveRecordingsIsabel/php/getLocalRecordings.php",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ auth_token: authCookie }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.recordings) {
            const formatted = data.recordings.map((rec) => ({
              id: rec.id,
              title: rec.title,
              description: rec.description,
              audioUrl: rec.recording,
            }));
            setRecordings(formatted);
          }
        }
      } catch (error) {
        console.error("Error fetching recordings:", error);
      }
    };

    fetchRecordings();
  }, []);

  const openModal = (rec) => setSelectedRecording(rec);
  const closeModal = () => setSelectedRecording(null);

  const playRecording = () => {
    if (!selectedRecording || !audioContextRef.current) return;

    const audioContext = audioContextRef.current;
    fetch(selectedRecording.audioUrl)
      .then((r) => r.arrayBuffer())
      .then((data) =>
        audioContext.decodeAudioData(data, (buffer) => {
          const source = audioContext.createBufferSource();
          source.buffer = buffer;
          const gainNode = audioContext.createGain();
          source.connect(gainNode).connect(audioContext.destination);
          source.start(0);
        })
      )
      .catch((err) => console.error("Error playing recording:", err));
  };

  if (loading) return <p className="ea-loading">Loading…</p>;

  return (
    <div className="ea-page">
      {/* Header */}
      <header className="ea-header">
        <div className="ea-logo-section" onClick={() => navigate("/")}>
          <span className="material-symbols-outlined ea-paw-icon">pets</span>
          <h1 className="ea-site-title">ANIMALBAND</h1>
        </div>
        <div className="ea-header-buttons">
          {user && (
            <img
              src={`https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php/${user.profilePic}`}
              alt="Profile"
              className="ea-profile-pic"
              onClick={() => navigate("/account")}
            />
          )}
        </div>
      </header>

      {/* Layout */}
      <div className="ea-layout">
        {/* Sidebar */}
        <aside className="ea-sidebar">
          <h3>Menu</h3>
          <ul>
            <li>
              <button onClick={() => navigate("/account")}>My Profile</button>
            </li>
            <li>
              <button onClick={() => navigate("/stage")}>Back to Stage</button>
            </li>
            <li>
              <button
                onClick={() => {
                  fetch(`${PHP_URL}/logout.php`, { credentials: "include" });
                  navigate("/login");
                }}
              >
                Logout
              </button>
            </li>
          </ul>
        </aside>

        {/* Main Content */}
        <main className="ea-content">
          <h1 className="ea-title">My Recordings</h1>
          <p className="ea-subtitle">
            Listen to your saved AnimalBand sessions.
          </p>

          <div className="recordings-grid">
            {recordings.map((rec) => (
              <div
                key={rec.id}
                className="recording-box"
                onClick={() => openModal(rec)}
              >
                <h3>{rec.title}</h3>
                <p>{rec.description}</p>
              </div>
            ))}
          </div>

          {selectedRecording && (
            <div className="modal-overlay" onClick={closeModal}>
              <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
              >
                <h2>{selectedRecording.title}</h2>
                <p>{selectedRecording.description}</p>
                <button onClick={playRecording} className="play-button">
                  Play Recording
                </button>
                <button className="close-button" onClick={closeModal}>
                  Close
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
        rel="stylesheet"
      />
    </div>
  );
}