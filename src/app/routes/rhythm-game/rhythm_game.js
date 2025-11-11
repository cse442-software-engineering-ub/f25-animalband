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

export default function RhythmGame() {
  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [notes, setNotes] = useState([]);
  const [pressedKeys, setPressedKeys] = useState({});
  const [sounds, setSounds] = useState({});
  const [masterVolume, setMasterVol] = useState(1);
  const [scores, setScores] = useState({ ostrich: 0, kangaroo: 0 });

  const NOTE_SPEED = 2;
  const SPAWN_INTERVAL = 600;
  const NOTE_SIZE = 45;
  const HIT_ZONE_SIZE = 55;
  const HIT_ZONE_BOTTOM_OFFSET = 10; // from CSS

  // Calculate hit zone center Y position
  const HIT_ZONE_CENTER_Y =
    window.innerHeight - HIT_ZONE_BOTTOM_OFFSET - HIT_ZONE_SIZE / 2;

  const OSTRICH_KEYS = ["h", "j", "k", "l"];
  const KANGAROO_KEYS = ["u", "i", "o", "p"];

  const gameLoopRef = useRef(null);
  const spawnIntervalRef = useRef(null);
  const noteIdRef = useRef(0);
  const audioContextRef = useRef(null);

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

  useEffect(() => {
    const savedVol = parseFloat(localStorage.getItem("masterVolume") || "1");
    setMasterVol(savedVol);
    setMasterVolume(savedVol);
  }, []);

  useEffect(() => {
    localStorage.setItem("masterVolume", masterVolume);
  }, [masterVolume]);

  const startGame = () => {
    setNotes([]);
    noteIdRef.current = 0;
    setScores({ ostrich: 0, kangaroo: 0 });
    setCountdown(3);

    const countInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(countInterval);
          setGameStarted(true);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (!gameStarted) return;

    spawnIntervalRef.current = setInterval(() => {
      const player = Math.random() > 0.5 ? "ostrich" : "kangaroo";
      const keys = player === "ostrich" ? OSTRICH_KEYS : KANGAROO_KEYS;
      const key = keys[Math.floor(Math.random() * keys.length)];

      setNotes((prev) => [
        ...prev,
        { id: noteIdRef.current++, player, key, y: -50, hit: false },
      ]);
    }, SPAWN_INTERVAL);

    return () => clearInterval(spawnIntervalRef.current);
  }, [gameStarted]);

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

  useEffect(() => {
    const HIT_TOLERANCE = 150; // forgiving range in pixels
    const MAX_POINTS = 100; // perfect hit points

    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (!OSTRICH_KEYS.includes(key) && !KANGAROO_KEYS.includes(key)) return;

      setPressedKeys((prev) => {
        if (prev[key]) return prev;
        return { ...prev, [key]: true };
      });

      if (sounds[key]) playSound(sounds[key], masterVolume);

      const player = OSTRICH_KEYS.includes(key) ? "ostrich" : "kangaroo";

      setNotes((prevNotes) => {
        let closestIndex = -1;
        let closestDist = Infinity;

        prevNotes.forEach((note, i) => {
          if (note.key === key && note.player === player && !note.hit) {
            // Compute distance from note center to hit zone center
            const noteCenter = note.y + NOTE_SIZE / 2;
            const dist = Math.abs(noteCenter - HIT_ZONE_CENTER_Y);

            if (dist < closestDist) {
              closestDist = dist;
              closestIndex = i;
            }
          }
        });

        if (closestIndex !== -1 && closestDist <= HIT_TOLERANCE) {
          // Cosine-based forgiving scoring
          const ratio = closestDist / HIT_TOLERANCE;
          const points = Math.round(
            MAX_POINTS * Math.cos((ratio * Math.PI) / 2)
          );

          setScores((prev) => ({
            ...prev,
            [player]: prev[player] + points,
          }));

          const newNotes = [...prevNotes];
          newNotes[closestIndex].hit = true;
          return newNotes;
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
  }, [sounds, masterVolume]);

  const isOstrichPlaying = OSTRICH_KEYS.some((key) => pressedKeys[key]);
  const isKangarooPlaying = KANGAROO_KEYS.some((key) => pressedKeys[key]);

  const resetGame = () => {
    setGameStarted(false);
    setNotes([]);
    setPressedKeys({});
    setCountdown(null);
    setScores({ ostrich: 0, kangaroo: 0 });
    cancelAnimationFrame(gameLoopRef.current);
    clearInterval(spawnIntervalRef.current);
  };

  return (
    <div className="rhythm-container">
      {!gameStarted && countdown === null && (
        <div className="start-screen">
          <h1 className="start-title">RHYTHM BATTLE</h1>
          <button className="start-button" onClick={startGame}>
            START GAME
          </button>
        </div>
      )}

      {countdown !== null && <div className="countdown">{countdown}</div>}

      {gameStarted && (
        <div className="game-area">
          <div className="player-section">
            <div className="score-display">Score: {scores.ostrich}</div>
            <img
              src={isOstrichPlaying ? OstrichPlaying : Ostrich}
              alt="Ostrich"
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
                        style={{ top: `${note.y}px` }}
                      />
                    ))}
                  <div
                    className={`hit-zone ${
                      pressedKeys[key] ? "hit-zone-active" : ""
                    }`}
                  >
                    <span className="hit-key">{key.toUpperCase()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="player-section">
            <div className="score-display">Score: {scores.kangaroo}</div>
            <img
              src={isKangarooPlaying ? KangarooPlaying : Kangaroo}
              alt="Kangaroo"
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
                        style={{ top: `${note.y}px` }}
                      />
                    ))}
                  <div
                    className={`hit-zone ${
                      pressedKeys[key] ? "hit-zone-active" : ""
                    }`}
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
              const vol = parseFloat(e.target.value);
              setMasterVol(vol);
              setMasterVolume(vol);
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
