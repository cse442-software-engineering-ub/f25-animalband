import { useEffect, useState, useRef } from "react";

import Ostrich from "../../../assets/ostrich.png";
import Kangaroo from "../../../assets/kangaroo.png";
import OstrichPlaying from "../../../assets/ostrichrockin.png";
import KangarooPlaying from "../../../assets/kangaroorockin.png";

import "./rhythm.css";

export default function RhythmGame() {
  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [notes, setNotes] = useState([]);
  const [pressedKeys, setPressedKeys] = useState({});

  const NOTE_SPEED = 4;
  const SPAWN_INTERVAL = 600;
  const HIT_ZONE_Y = 450;
  const HIT_TOLERANCE = 40;

  const OSTRICH_KEYS = ["h", "j", "k", "l"];
  const KANGAROO_KEYS = ["u", "i", "o", "p"];

  const gameLoopRef = useRef(null);
  const spawnIntervalRef = useRef(null);
  const noteIdRef = useRef(0);

  /* --- Start Game --- */
  const startGame = () => {
    setNotes([]);
    noteIdRef.current = 0;
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

  /* --- Spawn Notes --- */
  useEffect(() => {
    if (!gameStarted) return;

    spawnIntervalRef.current = setInterval(() => {
      const player = Math.random() > 0.5 ? "ostrich" : "kangaroo";
      const keys = player === "ostrich" ? OSTRICH_KEYS : KANGAROO_KEYS;
      const key = keys[Math.floor(Math.random() * keys.length)];

      setNotes((prev) => [
        ...prev,
        { id: noteIdRef.current++, player, key, y: -50 },
      ]);
    }, SPAWN_INTERVAL);

    return () => clearInterval(spawnIntervalRef.current);
  }, [gameStarted]);

  /* --- Game Loop --- */
  useEffect(() => {
    if (!gameStarted) return;

    const loop = () => {
      setNotes((prev) =>
        prev
          .map((note) => ({ ...note, y: note.y + NOTE_SPEED }))
          .filter((note) => note.y < window.innerHeight)
      );

      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(gameLoopRef.current);
  }, [gameStarted]);

  /* --- Key Handling --- */
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      setPressedKeys((prev) => ({ ...prev, [key]: true }));
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
  }, []);

  /* --- Derived States: isPlaying --- */
  const isOstrichPlaying = OSTRICH_KEYS.some((key) => pressedKeys[key]);
  const isKangarooPlaying = KANGAROO_KEYS.some((key) => pressedKeys[key]);

  /* --- Reset Game --- */
  const resetGame = () => {
    setGameStarted(false);
    setNotes([]);
    setPressedKeys({});
    setCountdown(null);
    cancelAnimationFrame(gameLoopRef.current);
    clearInterval(spawnIntervalRef.current);
  };

  /* --- Render --- */
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
          {/* Ostrich Section */}
          <div className="player-section">
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
                    .filter((n) => n.key === key && n.player === "ostrich")
                    .map((note) => (
                      <div
                        key={note.id}
                        className="note note-ostrich"
                        style={{ top: `${note.y}px` }}
                      >
                        <div className="note-inner" />
                      </div>
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

          {/* Kangaroo Section */}
          <div className="player-section">
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
                    .filter((n) => n.key === key && n.player === "kangaroo")
                    .map((note) => (
                      <div
                        key={note.id}
                        className="note note-kangaroo"
                        style={{ top: `${note.y}px` }}
                      >
                        <div className="note-inner" />
                      </div>
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
        </div>
      )}
    </div>
  );
}