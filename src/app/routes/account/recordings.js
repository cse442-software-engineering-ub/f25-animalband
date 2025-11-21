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
  "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php";

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
  const activeSourcesRef = useRef([]);

  // Animal mappings + images
  const ANIMAL_IMAGES = {
    hamster: [Hamster, HamsterPlaying],
    bird: [Bird, BirdPlaying],
    ostrich: [Ostrich, OstrichPlaying],
    kangaroo: [Kangaroo, KangarooPlaying],
    snake: [Snake, SnakePlaying],
  };

  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    const allImages = Object.values(ANIMAL_IMAGES).flat();
    let loadedCount = 0;

    allImages.forEach((src) => {
      fetch(src)
        .then((res) => res.blob())
        .then((blob) => {
          const img = new Image();
          img.onload = () => {
            loadedCount++;
            if (loadedCount === allImages.length) {
              setImagesLoaded(true);
              //console.log("All animal images fully preloaded");
            }
          };
          img.onerror = () => console.warn("Failed to preload:", src);
          img.src = URL.createObjectURL(blob);
        })
        .catch((err) => console.warn("Failed to fetch image:", src, err));
    });
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

  // Load sound files
  const loadSoundForPage = async (filename) => {
    const audioContext = audioContextRef.current;
    const url = `${process.env.PUBLIC_URL}/stage_sounds/${filename}`;
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await audioContext.decodeAudioData(arrayBuffer);
  };

  // User fetch
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

  // Audio context + sound buffers
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

  // Navigate to stage with edit parameter
  const editRecording = (rec) => {
    navigate(`/stage?edit=${rec.id}`);
  };

  // Play recording with animation
  const playRecording = async () => {
    if (recordedNotes.length === 0) return;

    const audioContext = audioContextRef.current;
    if (!audioContext) return;

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    setIsPlaying(true);

    // Track the total playback time
    let longestTime = 0;

    recordedNotes.forEach((track) => {
      track.forEach(({ key, time }) => {
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

        // Keep track so we can stop later
        activeSourcesRef.current.push(source);
        source.onended = () => {
          activeSourcesRef.current = activeSourcesRef.current.filter(
            (s) => s !== source
          );
        };

        // Animate the corresponding animal
        const animal = animalKeyMap[key];
        if (animal) {
          setTimeout(() => {
            setPlayingAnimals((prev) => ({ ...prev, [animal]: true }));
            setTimeout(() => {
              setPlayingAnimals((prev) => ({ ...prev, [animal]: false }));
            }, 500);
          }, time);
        }

        if (time > longestTime) longestTime = time;
      });
    });

    // Stop playing after the recording finishes
    setTimeout(() => {
      setIsPlaying(false);
      setPlayingAnimals({});
    }, longestTime + 500);
  };

  const stopAllSounds = () => {
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop(0);
      } catch (e) {
        // already stopped
      }
    });
    activeSourcesRef.current = [];
    setIsPlaying(false);
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
            <li><button className="df-sidebar-btn" onClick={() => navigate("/")}>Home</button></li>
            <li><button className="df-sidebar-btn" onClick={() => navigate("/forum")}>Forum</button></li>
            <li><button onClick={() => navigate("/my-recordings")}>My Recordings</button></li>
            <li><button onClick={() => navigate("/playlists")}>My Playlists</button></li>
            <li><button onClick={() => navigate("/stage")}>Back to Stage</button></li>
            <li><button className="df-sidebar-btn logout-btn" onClick={() => navigate("/login")}>
              Logout
            </button></li>
          </ul>
        </aside>

        <main className="ea-content">
          <h1 className="ea-title">My Recordings</h1>
          <p className="ea-subtitle">
            Listen to your saved AnimalBand sessions or edit them.
          </p>

          <div className="recordings-grid">
            {recordings.length === 0 && (
              <p style={{ textAlign: 'center', width: '100%', padding: '20px' }}>
                No recordings yet. Go to the stage to create your first recording!
              </p>
            )}
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
                style={{ maxWidth: '600px', position: 'relative' }}
              >
                <h2>{selectedRecording.title}</h2>
                <p>{selectedRecording.description}</p>

                {/* Mini animal stage */}
                <div className="mini-stage" style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '15px',
                  margin: '20px 0',
                  minHeight: '120px'
                }}>
                  {Object.keys(ANIMAL_IMAGES)
                    .filter((animal) =>
                      recordedNotes.some((track) =>
                        track.some((note) => animalKeyMap[note.key] === animal)
                      )
                    )
                    .map((animal) => (
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
                        style={{
                          height: '80px',
                          width: 'auto',
                          transition: 'transform 0.3s ease'
                        }}
                      />
                    ))}
                </div>

                <div className="buttons-row" style={{
                  display: 'flex',
                  gap: '15px',
                  justifyContent: 'center',
                  marginTop: '20px'
                }}>
                  <button
                    onClick={playRecording}
                    disabled={!imagesLoaded || isPlaying}
                    className="circle-btn play"
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      backgroundColor: isPlaying ? '#666' : '#15803d',
                      color: 'white',
                      border: 'none',
                      cursor: isPlaying ? 'not-allowed' : 'pointer',
                      fontSize: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Play Recording"
                    aria-label="Play Recording"
                  >
                    {isPlaying ? '■' : '▶'}
                  </button>
                  <button
                    onClick={() => editRecording(selectedRecording)}
                    className="circle-btn edit"
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      backgroundColor: '#15803d',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Edit Recording"
                    aria-label="Edit Recording"
                  >
                    ✏️
                  </button>
                  <button
                    className="circle-btn close"
                    onClick={() => {
                      stopAllSounds();
                      closeModal();
                    }}
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      backgroundColor: '#9E9E9E',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Close"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>
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