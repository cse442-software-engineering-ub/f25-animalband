import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SOUND_CONFIG } from "../stage/stage_soundsConfig";
import {
  loadSound,
  playSound,
  setMasterVolume,
} from "../stage/stage_audioUtil";

import Ostrich from "../../../assets/hamster.png";
import OstrichPlaying from "../../../assets/hamsterrockin.png";
import Kangaroo from "../../../assets/kangaroo.png";
import KangarooPlaying from "../../../assets/kangaroorockin.png";

import "./rhythm.css";

export default function RhythmGame() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [notes, setNotes] = useState([]);
  const [pressedKeys, setPressedKeys] = useState({});
  const [sounds, setSounds] = useState({});
  const [masterVolume, setMasterVol] = useState(1);
  const [scores, setScores] = useState({ ostrich: 0, kangaroo: 0 });
  const scoresRef = useRef({ ostrich: 0, kangaroo: 0 });
  scoresRef.current = scores;

  const GAME_DURATION = 30;
  const [timeRemaining, setTimeRemaining] = useState(GAME_DURATION);
  const [showResults, setShowResults] = useState(false);
  const [winnerText, setWinnerText] = useState("");
  const [isNarrowScreen, setIsNarrowScreen] = useState(false);

  const NOTE_SPEED = 1.5;
  const SPAWN_INTERVAL = 1200;
  const NOTE_SIZE = 55;
  const MIN_LANE_SPACING = 80;

  const hitZoneRefs = useRef({});
  const [hitZoneCenters, setHitZoneCenters] = useState({});

  const OSTRICH_KEYS = ["a", "s", "d", "f"];
  const KANGAROO_KEYS = ["u", "i", "o", "p"];

  const gameLoopRef = useRef(null);
  const spawnIntervalRef = useRef(null);
  const noteIdRef = useRef(0);
  const audioContextRef = useRef(null);
  const timerRef = useRef(null);

  const notesRef = useRef([]);
  notesRef.current = notes;

  const lastPlayerRef = useRef(null);

  /** FETCH USER **/
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(
          "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php/getUser.php",
          { credentials: "include" }
        );
        const data = await res.json();
        if (data.loggedIn) setUser(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
  }, []);

  /** CHECK SCREEN WIDTH **/
  useEffect(() => {
    const checkScreenWidth = () => {
      setIsNarrowScreen(window.innerWidth <= 430);
    };

    checkScreenWidth();
    window.addEventListener("resize", checkScreenWidth);

    return () => window.removeEventListener("resize", checkScreenWidth);
  }, []);

  const handleAccountClick = () => {
    if (user) navigate("/account");
    else navigate("/login");
  };

  /** LOAD SOUNDS **/
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
    }

    const loadAllSounds = async () => {
      const loaded = {};
      for (const sound of SOUND_CONFIG) {
        loaded[sound.key] = await loadSound(sound.file);
      }
      setSounds(loaded);
    };
    loadAllSounds();
  }, []);

  /** LOAD VOLUME **/
  useEffect(() => {
    const savedVol = parseFloat(localStorage.getItem("masterVolume") || "1");
    setMasterVol(savedVol);
    setMasterVolume(savedVol);
  }, []);

  useEffect(() => {
    localStorage.setItem("masterVolume", masterVolume);
  }, [masterVolume]);

  /** MEASURE HIT ZONES **/
  useEffect(() => {
    if (gameStarted && countdown === null) {
      const centers = {};
      Object.entries(hitZoneRefs.current).forEach(([key, el]) => {
        if (el) {
          const rect = el.getBoundingClientRect();
          const parent = el.closest(".lane");
          const parentRect = parent
            ? parent.getBoundingClientRect()
            : { top: 0 };
          centers[key] = rect.top - parentRect.top + rect.height / 2;
        }
      });
      setHitZoneCenters(centers);

      const timer = setTimeout(() => {
        const centers = {};
        Object.entries(hitZoneRefs.current).forEach(([key, el]) => {
          if (el) {
            const rect = el.getBoundingClientRect();
            const parent = el.closest(".lane");
            const parentRect = parent
              ? parent.getBoundingClientRect()
              : { top: 0 };
            centers[key] = rect.top - parentRect.top + rect.height / 2;
          }
        });
        setHitZoneCenters(centers);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [gameStarted, countdown]);

  /** START GAME **/
  const startGame = () => {
    setNotes([]);
    noteIdRef.current = 0;
    setScores({ ostrich: 0, kangaroo: 0 });
    scoresRef.current = { ostrich: 0, kangaroo: 0 };
    setTimeRemaining(GAME_DURATION);
    setShowResults(false);
    setWinnerText("");
    setPressedKeys({});
    lastPlayerRef.current = null;

    setCountdown(3);
    const countInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(countInterval);
          setCountdown(null);
          setGameStarted(true);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const resetGame = () => {
    cancelAnimationFrame(gameLoopRef.current);
    clearInterval(spawnIntervalRef.current);
    clearInterval(timerRef.current);

    setGameStarted(false);
    setNotes([]);
    setPressedKeys({});
    setCountdown(null);
    setScores({ ostrich: 0, kangaroo: 0 });
    scoresRef.current = { ostrich: 0, kangaroo: 0 };
    setTimeRemaining(GAME_DURATION);
    lastPlayerRef.current = null;
  };

  /** TIMER COUNTDOWN **/
  useEffect(() => {
    if (!gameStarted || countdown !== null) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          endGame();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameStarted, countdown]);

  /** END GAME **/
  const endGame = () => {
    setGameStarted(false);
    cancelAnimationFrame(gameLoopRef.current);
    clearInterval(spawnIntervalRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    setScores((currentScores) => {
      let winner = "";
      if (currentScores.ostrich > currentScores.kangaroo) {
        winner = "Hamster Wins!";
      } else if (currentScores.kangaroo > currentScores.ostrich) {
        winner = "Kangaroo Wins!";
      } else {
        winner = "It's a Tie!";
      }

      setWinnerText(winner);
      setShowResults(true);

      return currentScores;
    });
  };

  /** SPAWN NOTES **/
  useEffect(() => {
    if (!gameStarted) return;

    spawnIntervalRef.current = setInterval(() => {
      const player =
        lastPlayerRef.current === "ostrich" ? "kangaroo" : "ostrich";
      lastPlayerRef.current = player;

      const keys = player === "ostrich" ? OSTRICH_KEYS : KANGAROO_KEYS;
      let key = keys[Math.floor(Math.random() * keys.length)];

      const recentNotes = notesRef.current.filter(
        (n) => n.player === player && n.key === key
      );
      if (recentNotes.length > 0) {
        const lastNote = recentNotes[recentNotes.length - 1];
        if (lastNote.y < MIN_LANE_SPACING) {
          const alternativeKeys = keys.filter((k) => k !== key);
          if (alternativeKeys.length > 0) {
            key =
              alternativeKeys[
                Math.floor(Math.random() * alternativeKeys.length)
              ];
          }
        }
      }

      const newNote = {
        id: noteIdRef.current++,
        player,
        key,
        y: -50,
        hit: false,
      };
      setNotes((prev) => [...prev, newNote]);
    }, SPAWN_INTERVAL);

    return () => clearInterval(spawnIntervalRef.current);
  }, [gameStarted]);

  /** GAME LOOP **/
  useEffect(() => {
    if (!gameStarted) return;

    const loop = () => {
      setNotes((prev) =>
        prev
          .map((note) => ({ ...note, y: note.y + NOTE_SPEED }))
          .filter((note) => note.y < window.innerHeight + 50)
      );

      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(gameLoopRef.current);
  }, [gameStarted]);

  /** HANDLE KEY/TOUCH INPUT **/
  const handleInput = (key) => {
    if (!OSTRICH_KEYS.includes(key) && !KANGAROO_KEYS.includes(key)) return;

    setPressedKeys((prev) => ({ ...prev, [key]: true }));
    if (sounds[key]) playSound(sounds[key], masterVolume);

    const player = OSTRICH_KEYS.includes(key) ? "ostrich" : "kangaroo";

    if (!hitZoneCenters[key] || !gameStarted) return;

    const HIT_TOLERANCE = 100;
    const MAX_POINTS = 100;

    setNotes((prevNotes) => {
      let index = -1;
      let best = Infinity;

      prevNotes.forEach((note, i) => {
        if (note.key === key && note.player === player && !note.hit) {
          const noteCenter = note.y + NOTE_SIZE / 2;
          const hitZoneCenter = hitZoneCenters[key];
          const dist = Math.abs(noteCenter - hitZoneCenter);

          if (dist < best) {
            best = dist;
            index = i;
          }
        }
      });

      if (index !== -1 && best <= HIT_TOLERANCE) {
        const ratio = best / HIT_TOLERANCE;
        const points = Math.round(MAX_POINTS * Math.cos((ratio * Math.PI) / 2));

        setScores((prev) => {
          const newScores = {
            ...prev,
            [player]: prev[player] + points,
          };
          scoresRef.current = newScores;
          return newScores;
        });

        const arr = [...prevNotes];
        arr[index].hit = true;
        return arr;
      }

      return prevNotes;
    });

    setTimeout(() => {
      setPressedKeys((prev) => ({ ...prev, [key]: false }));
    }, 100);
  };

  /** KEYS + SCORING **/
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (pressedKeys[key]) return;
      handleInput(key);
    };

    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      setPressedKeys((prev) => ({ ...prev, [key]: false }));
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [sounds, masterVolume, hitZoneCenters, gameStarted, pressedKeys]);

  const isOstrichPlaying = OSTRICH_KEYS.some((k) => pressedKeys[k]);
  const isKangarooPlaying = KANGAROO_KEYS.some((k) => pressedKeys[k]);

  const returnToStart = () => {
    resetGame();
    setShowResults(false);
    setWinnerText("");
  };

  return (
    <div className="rhythm-container">
      {/* HEADER */}
      <header className="rhythm-header">
        <Link to="/" className="rhythm-logo-section">
          <span className="material-symbols-outlined rhythm-paw-icon">
            pets
          </span>
          <h1 className="rhythm-site-title">ANIMALBAND</h1>
        </Link>
        <div className="rhythm-header-buttons">
          {!user ? (
            <>
              <button
                className="rhythm-btn-login"
                onClick={() => navigate("/login")}
              >
                Login
              </button>
              <button
                className="rhythm-btn-register"
                onClick={() => navigate("/register")}
              >
                Register
              </button>
            </>
          ) : (
            <img
              src={`https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php/${user.profilePic}`}
              alt="Profile"
              className="rhythm-profile-pic"
              onClick={handleAccountClick}
            />
          )}
        </div>
      </header>

      {/* RESULTS POPUP */}
      {showResults && (
        <div className="results-overlay">
          <div className="results-box">
            <h2>{winnerText}</h2>
            <button className="play-again-btn" onClick={returnToStart}>
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* START SCREEN */}
      {!gameStarted && countdown === null && !showResults && (
        <div className="start-screen">
          <h1 className="start-title">RHYTHM BATTLE</h1>
          {isNarrowScreen && (
            <p className="rotate-message">
              Please rotate your device for the best experience.
            </p>
          )}
          <button className="start-button" onClick={startGame}>
            START GAME
          </button>
        </div>
      )}

      {/* COUNTDOWN */}
      {countdown !== null && <div className="countdown">{countdown}</div>}

      {/* GAME AREA */}
      {gameStarted && (
        <div className="game-area">
          {/* TIMER */}
          <div className="game-timer">⏱ {timeRemaining}s</div>

          {/* PLAYERS CONTAINER */}
          <div className="players-container">
            {/* Ostrich Section */}
            <div className="player-section">
              <div className="score-display">Score: {scores.ostrich}</div>
              <img
                src={isOstrichPlaying ? OstrichPlaying : Ostrich}
                className="animal-icon"
                alt="Ostrich"
              />
              <div className="lanes-group">
                {OSTRICH_KEYS.map((key) => (
                  <div
                    key={key}
                    className={`lane ${pressedKeys[key] ? "lane-pressed" : ""}`}
                  >
                    {notes
                      .filter(
                        (n) => n.key === key && n.player === "ostrich" && !n.hit
                      )
                      .map((note) => (
                        <div
                          key={note.id}
                          className="note note-ostrich"
                          style={{ top: note.y }}
                        />
                      ))}
                    <div
                      className={`hit-zone ${
                        pressedKeys[key] ? "hit-zone-active" : ""
                      }`}
                      ref={(el) => (hitZoneRefs.current[key] = el)}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        handleInput(key);
                      }}
                      onClick={() => handleInput(key)}
                    >
                      <span className="hit-key">{key.toUpperCase()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Kangaroo Section */}
            <div className="player-section">
              <div className="score-display">Score: {scores.kangaroo}</div>
              <img
                src={isKangarooPlaying ? KangarooPlaying : Kangaroo}
                className="animal-icon"
                alt="Kangaroo"
              />
              <div className="lanes-group">
                {KANGAROO_KEYS.map((key) => (
                  <div
                    key={key}
                    className={`lane ${pressedKeys[key] ? "lane-pressed" : ""}`}
                  >
                    {notes
                      .filter(
                        (n) =>
                          n.key === key && n.player === "kangaroo" && !n.hit
                      )
                      .map((note) => (
                        <div
                          key={note.id}
                          className="note note-kangaroo"
                          style={{ top: note.y }}
                        />
                      ))}
                    <div
                      className={`hit-zone ${
                        pressedKeys[key] ? "hit-zone-active" : ""
                      }`}
                      ref={(el) => (hitZoneRefs.current[key] = el)}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        handleInput(key);
                      }}
                      onClick={() => handleInput(key)}
                    >
                      <span className="hit-key">{key.toUpperCase()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CONTROLS AT BOTTOM */}
          <div className="game-controls">
            <button className="reset-button" onClick={resetGame}>
              RESET
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={masterVolume}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setMasterVol(v);
                setMasterVolume(v);
              }}
              className="volume-slider"
            />
          </div>
        </div>
      )}

      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
        rel="stylesheet"
      />
    </div>
  );
}