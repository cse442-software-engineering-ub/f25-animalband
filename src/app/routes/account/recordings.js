import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./recordings.css";
import "./desktop_edit_account.css"; // reuse shared layout + header + sidebar styles
import { SOUND_CONFIG } from "../stage/stage_soundsConfig";

const PHP_URL =
  "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/saveRecordingsIsabel/php";

export default function MyRecordings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [recordings, setRecordings] = useState([]);
  const [recordedNotes, setRecordedNotes] = useState([]);
  const [selectedRecording, setSelectedRecording] = useState(null);

  const [sounds, setSounds] = useState({});
  const [isPlaying, setIsPlaying] = useState(false);
  const masterVolume = 1;

  const audioContextRef = useRef(null);

  // ------------------ LOCAL LOADSOUND ------------------
  const loadSoundForPage = async (filename) => {
    const audioContext = audioContextRef.current;
    if (!audioContext) throw new Error("AudioContext not initialized");

    const url = `${process.env.PUBLIC_URL}/stage_sounds/${filename}`;
    console.log("[DEBUG] Fetching:", url);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - Could not load ${url}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return await audioContext.decodeAudioData(arrayBuffer);
  };
  // -----------------------------------------------------

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

  // Load sounds into buffers using local loadSoundForPage
  useEffect(() => {
    if (!audioContextRef.current) return;

    const loadAllSounds = async () => {
      const loadedSounds = {};
      for (const sound of SOUND_CONFIG) {
        try {
          loadedSounds[sound.key] = await loadSoundForPage(sound.file);
        } catch (err) {
          console.warn(`Failed to load sound ${sound.file}:`, err);
        }
      }
      setSounds(loadedSounds);
    };

    loadAllSounds();
  }, [audioContextRef.current]);

  // Fetch recordings
  useEffect(() => {
    const fetchRecordings = async () => {
      const cookies = document.cookie.split("; ");
      const cookieObj = Object.fromEntries(cookies.map((c) => c.split("=")));
      const authCookie = cookieObj["auth_token"] || "";
      try {
        const response = await fetch(`${PHP_URL}/getLocalRecordings.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ auth_token: authCookie }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.recordings) {
            const formatted = data.recordings.map((rec) => ({
              id: rec.id,
              title: rec.title,
              description: rec.description,
              recordedNotes: rec.recording || [],
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

  const openModal = (rec) => {
    setSelectedRecording(rec);
    setRecordedNotes(rec.recordedNotes || []);
  };

  const closeModal = () => {
    setSelectedRecording(null);
    setRecordedNotes([]);
  };

  const playRecording = async () => {
    console.log("START OF PLAYRECORDING");
    console.log(recordedNotes);
    if (recordedNotes.length === 0) return;

    const audioContext = audioContextRef.current;
    if (!audioContext) return;

    // Resume AudioContext (must be done on user gesture)
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    console.log("setisplaying reached");
    setIsPlaying(true);

    recordedNotes.forEach(({ key, time }) => {
      const buffer = sounds[key];
      if (!buffer) {
        console.warn(`Sound for key ${key} not loaded`);
        return;
      }

      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      const gainNode = audioContext.createGain();
      gainNode.gain.value = masterVolume;
      source.connect(gainNode).connect(audioContext.destination);
      source.start(audioContext.currentTime + time / 1000);
    });

    const totalTime = recordedNotes[recordedNotes.length - 1].time + 400;
    setTimeout(() => setIsPlaying(false), totalTime);
  };

  if (loading) return <p className="ea-loading">Loading…</p>;

  return (
    <div className="ea-page">
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

      <div className="ea-layout">
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
                  {isPlaying ? "Playing…" : "Play Recording"}
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