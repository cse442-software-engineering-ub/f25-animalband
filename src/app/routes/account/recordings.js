import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./recordings.css";
import "./desktop_edit_account.css";
import { SOUND_CONFIG } from "../stage/stage_soundsConfig";

import Ostrich from "../../../assets/ostrich.png";
import OstrichPlaying from "../../../assets/ostrichrockin.png";
import Bird from "../../../assets/bird.png";
import BirdPlaying from "../../../assets/birdrockin.png";
import Hamster from "../../../assets/hamster.png";
import HamsterPlaying from "../../../assets/hamsterrockin.png";
import Kangaroo from "../../../assets/kangaroo.png";
import KangarooPlaying from "../../../assets/kangaroorockin.png";
import Snake from "../../../assets/snake.png";
import SnakePlaying from "../../../assets/snakerockin.png";

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
  const [playingAnimals, setPlayingAnimals] = useState({});

  const masterVolume = 1;
  const audioContextRef = useRef(null);

  // --- animal mappings + images (same as stage) ---
  const ANIMAL_IMAGES = {
    hamster: [Hamster, HamsterPlaying],
    bird: [Bird, BirdPlaying],
    ostrich: [Ostrich, OstrichPlaying],
    kangaroo: [Kangaroo, KangarooPlaying],
    snake: [Snake, SnakePlaying],
  };

  useEffect(() => {
    const preload = (src) => {
      const img = new Image();
      img.src = src;
    };

    Object.values(ANIMAL_IMAGES)
      .flat() // flatten idle + playing pairs
      .forEach(preload);
  }, []);

  const animalKeyMap = {
    a: "hamster",
    s: "hamster",
    d: "hamster",
    f: "hamster",
    c: "bird",
    v: "bird",
    b: "bird",
    n: "bird",
    h: "ostrich",
    j: "ostrich",
    k: "ostrich",
    l: "ostrich",
    u: "kangaroo",
    i: "kangaroo",
    o: "kangaroo",
    p: "kangaroo",
    q: "snake",
    w: "snake",
    e: "snake",
    r: "snake",
  };

  // --- load sound files ---
  const loadSoundForPage = async (filename) => {
    const audioContext = audioContextRef.current;
    const url = `${process.env.PUBLIC_URL}/stage_sounds/${filename}`;
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await audioContext.decodeAudioData(arrayBuffer);
  };

  // --- user fetch ---
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

  // --- audio context + sound buffers ---
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
    }

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
  }, []);

  // --- fetch recordings ---
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

  // --- play recording with animation ---
  const playRecording = async () => {
    if (recordedNotes.length === 0) return;

    const audioContext = audioContextRef.current;
    if (!audioContext) return;

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    setIsPlaying(true);

    recordedNotes.forEach((track) => {
      track.forEach(({ key, time }) => {
        const buffer = sounds[key];
        if (!buffer) return;
        const animal = animalKeyMap[key];
        const source = audioContext.createBufferSource();
        source.buffer = buffer;

        const gainNode = audioContext.createGain();
        gainNode.gain.value = masterVolume;

        source.connect(gainNode).connect(audioContext.destination);
        source.start(audioContext.currentTime + time / 1000);

        // Animate animals just like stage
        setTimeout(() => {
          setPlayingAnimals((prev) => ({ ...prev, [animal]: true }));
          setTimeout(() => {
            setPlayingAnimals((prev) => ({ ...prev, [animal]: false }));
          }, 300);
        }, time);
      });
    });

    // Find total playback time
    const longest = Math.max(
      ...recordedNotes.map((track) =>
        track.length ? track[track.length - 1].time : 0
      )
    );
    setTimeout(() => setIsPlaying(false), longest + 500);
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

                {/* mini animal stage */}
                <div className="mini-stage">
                  {Object.keys(ANIMAL_IMAGES).map((animal) => (
                    <img
                      key={animal}
                      src={
                        playingAnimals[animal]
                          ? ANIMAL_IMAGES[animal][1]
                          : ANIMAL_IMAGES[animal][0]
                      }
                      alt={animal}
                      className={`mini-animal ${
                        playingAnimals[animal] ? "playing" : ""
                      }`}
                    />
                  ))}
                </div>

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