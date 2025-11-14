import { useEffect, useState, useRef } from "react";
import { SOUND_CONFIG } from "../stage/stage_soundsConfig";
import {
  loadSound,
  playSound,
  setMasterVolume,
} from "../stage/stage_audioUtil";

import Ostrich from "../../../assets/ostrich.png";
import OstrichPlaying from "../../../assets/ostrichrockin.png";
import Kangaroo from "../../../assets/kangaroo.png";
import KangarooPlaying from "../../../assets/kangaroorockin.png";

import "./rhythm.css";
import "./timer.css";

export default function RhythmGame() {
  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [notes, setNotes] = useState([]);
  const [pressedKeys, setPressedKeys] = useState({});
  const [sounds, setSounds] = useState({});
  const [masterVolume, setMasterVol] = useState(1);
  const [scores, setScores] = useState({ ostrich: 0, kangaroo: 0 });

  const GAME_DURATION = 30;
  const [timeRemaining, setTimeRemaining] = useState(GAME_DURATION);
  const [showResults, setShowResults] = useState(false);
  const [winnerText, setWinnerText] = useState("");

  const NOTE_SPEED = 1;
  const SPAWN_INTERVAL = 1200;
  const NOTE_SIZE = 55;
  const MIN_LANE_SPACING = 80;

  const hitZoneRefs = useRef({});
  const [hitZoneCenters, setHitZoneCenters] = useState({});

  const OSTRICH_KEYS = ["h", "j", "k", "l"];
  const KANGAROO_KEYS = ["u", "i", "o", "p"];

  const gameLoopRef = useRef(null);
  const spawnIntervalRef = useRef(null);
  const noteIdRef = useRef(0);
  const audioContextRef = useRef(null);
  const timerRef = useRef(null);

  const notesRef = useRef([]);
  notesRef.current = notes;

  const lastPlayerRef = useRef(null);

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

  /** MEASURE HIT ZONES - Fixed to remeasure after countdown **/
  useEffect(() => {
    if (gameStarted && countdown === null) {
      // Measure immediately
      const centers = {};
      Object.entries(hitZoneRefs.current).forEach(([key, el]) => {
        if (el) {
          const rect = el.getBoundingClientRect();
          centers[key] = rect.top + rect.height / 2;
        }
      });
      setHitZoneCenters(centers);

      // Also measure again after a delay to be safe
      const timer = setTimeout(() => {
        const centers = {};
        Object.entries(hitZoneRefs.current).forEach(([key, el]) => {
          if (el) {
            const rect = el.getBoundingClientRect();
            centers[key] = rect.top + rect.height / 2;
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
        winner = "Ostrich Wins!";
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

  /** SPAWN NOTES - Alternating between players for fairness **/
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

  /** KEYS + SCORING **/
  useEffect(() => {
    const HIT_TOLERANCE = 150;
    const MAX_POINTS = 100;

    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (!OSTRICH_KEYS.includes(key) && !KANGAROO_KEYS.includes(key)) return;

      setPressedKeys((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
      if (sounds[key]) playSound(sounds[key], masterVolume);

      const player = OSTRICH_KEYS.includes(key) ? "ostrich" : "kangaroo";

      if (!hitZoneCenters[key] || !gameStarted) return;

      setNotes((prevNotes) => {
        let index = -1;
        let best = Infinity;

        prevNotes.forEach((note, i) => {
          if (note.key === key && note.player === player && !note.hit) {
            const noteCenter = note.y + NOTE_SIZE / 2;
            const dist = Math.abs(noteCenter - hitZoneCenters[key]);
            if (dist < best) {
              best = dist;
              index = i;
            }
          }
        });

        if (index !== -1 && best <= HIT_TOLERANCE) {
          const ratio = best / HIT_TOLERANCE;
          const points = Math.round(
            MAX_POINTS * Math.cos((ratio * Math.PI) / 2)
          );

          setScores((prev) => ({
            ...prev,
            [player]: prev[player] + points,
          }));

          const arr = [...prevNotes];
          arr[index].hit = true;
          return arr;
        }

        return prevNotes;
      });
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
  }, [sounds, masterVolume, hitZoneCenters, gameStarted]);

  const isOstrichPlaying = OSTRICH_KEYS.some((k) => pressedKeys[k]);
  const isKangarooPlaying = KANGAROO_KEYS.some((k) => pressedKeys[k]);

  /** RESET **/
  const resetGame = () => {
    cancelAnimationFrame(gameLoopRef.current);
    clearInterval(spawnIntervalRef.current);
    clearInterval(timerRef.current);

    setGameStarted(false);
    setNotes([]);
    setPressedKeys({});
    setCountdown(null);
    setScores({ ostrich: 0, kangaroo: 0 });
    setTimeRemaining(GAME_DURATION);
    lastPlayerRef.current = null;
    // Don't clear hitZoneCenters here - let the useEffect handle it
  };

  const returnToStart = () => {
    resetGame();
    setShowResults(false);
    setWinnerText("");
  };

  return (
    <div className="rhythm-container">
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
          <div className="game-timer">⏱ {timeRemaining}s</div>

          {/* Ostrich Section */}
          <div className="player-section">
            <div className="score-display">Score: {scores.ostrich}</div>
            <img
              src={isOstrichPlaying ? OstrichPlaying : Ostrich}
              className="animal-icon"
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
            />
            <div className="lanes-group">
              {KANGAROO_KEYS.map((key) => (
                <div
                  key={key}
                  className={`lane ${pressedKeys[key] ? "lane-pressed" : ""}`}
                >
                  {notes
                    .filter(
                      (n) => n.key === key && n.player === "kangaroo" && !n.hit
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
                  >
                    <span className="hit-key">{key.toUpperCase()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

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
            style={{
              position: "fixed",
              bottom: "20px",
              left: "20px",
              width: "150px",
            }}
          />
        </div>
      )}
    </div>
  );
}