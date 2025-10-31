import { useState, useEffect, useRef } from "react";
import "./rhythm.css";

import Ostrich from "../../../assets/ostrich.png";
import Bird from "../../../assets/bird.png";
import Hamster from "../../../assets/hamster.png";
import Kangaroo from "../../../assets/kangaroo.png";
import Snake from "../../../assets/snake.png";

// Use proper public URLs (these should match your /public/stage_sounds folder)
const SOUND_PATHS = {
  ostrich: `${process.env.PUBLIC_URL}/stage_sounds/keys/temp_keys_CM.wav`,
  bird: `${process.env.PUBLIC_URL}/stage_sounds/vocal/double_chirp.wav`,
  hamster: `${process.env.PUBLIC_URL}/stage_sounds/drums/Snare_temp.wav`,
  kangaroo: `${process.env.PUBLIC_URL}/stage_sounds/guitar/temp_guitar_CM.wav`,
  snake: `${process.env.PUBLIC_URL}/stage_sounds/bass/temp_bass_G.wav`,
};

const LANES = [
  { key: "a", animal: "ostrich", image: Ostrich, sound: SOUND_PATHS.ostrich },
  { key: "s", animal: "bird", image: Bird, sound: SOUND_PATHS.bird },
  { key: "d", animal: "hamster", image: Hamster, sound: SOUND_PATHS.hamster },
  {
    key: "f",
    animal: "kangaroo",
    image: Kangaroo,
    sound: SOUND_PATHS.kangaroo,
  },
  { key: "g", animal: "snake", image: Snake, sound: SOUND_PATHS.snake },
];

const NOTES = [
  { lane: 0, time: 1000 },
  { lane: 2, time: 1500 },
  { lane: 1, time: 2000 },
  { lane: 4, time: 2500 },
  { lane: 3, time: 3000 },
];

export default function RhythmGame() {
  const [time, setTime] = useState(0);
  const [notes, setNotes] = useState([]);
  const [running, setRunning] = useState(false);
  const [sounds, setSounds] = useState({});
  const audioCtxRef = useRef(null);

  const startTime = useRef(null);
  const raf = useRef(null);

  const timeRef = useRef(time);
  const notesRef = useRef(notes);

  const laneHeight = 400;
  const noteSize = 50;
  const speed = 0.13;

  // Keep refs in sync
  useEffect(() => {
    timeRef.current = time;
    notesRef.current = notes;
  }, [time, notes]);

  // --- Initialize AudioContext + Load sounds ---
  useEffect(() => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtxRef.current = ctx;

    const loadSound = async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to load sound: ${url}`);
      const arrayBuffer = await res.arrayBuffer();
      return await ctx.decodeAudioData(arrayBuffer);
    };

    const loadAll = async () => {
      const loaded = {};
      for (const lane of LANES) {
        try {
          loaded[lane.key] = await loadSound(lane.sound);
        } catch (err) {
          console.error("Error loading sound:", lane.sound, err);
        }
      }
      setSounds(loaded);
    };

    loadAll();
  }, []);

  // --- Game loop ---
  const update = (t) => {
    if (!startTime.current) startTime.current = t;
    const elapsed = t - startTime.current;
    setTime(elapsed);
    raf.current = requestAnimationFrame(update);
  };

  const handleStart = () => {
    if (!running) {
      setRunning(true);
      startTime.current = null;
      setTime(0);
      setNotes(NOTES.map((n) => ({ ...n, hit: false })));
      raf.current = requestAnimationFrame(update);
    }
  };

  const handleReset = () => {
    cancelAnimationFrame(raf.current);
    setRunning(false);
    setTime(0);
    setNotes([]);
  };

  // --- Handle key presses + play sounds ---
  const handleKeyDown = (e) => {
    const laneIndex = LANES.findIndex((l) => l.key === e.key);
    if (laneIndex === -1) return;

    const ctx = audioCtxRef.current;
    if (!ctx || !sounds[e.key]) return;

    // Resume context if suspended (browser auto-play policy)
    if (ctx.state === "suspended") ctx.resume();

    const source = ctx.createBufferSource();
    source.buffer = sounds[e.key];
    source.connect(ctx.destination);
    source.start(0);

    const currentTime = timeRef.current;
    const currentNotes = notesRef.current;

    const note = currentNotes.find(
      (n) =>
        n.lane === laneIndex && !n.hit && Math.abs(n.time - currentTime) < 300
    );

    if (note) {
      note.hit = true;
      setNotes([...currentNotes]);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sounds]);

  // --- Rendering ---
  return (
    <div className="game">
      <div className="lanes">
        {LANES.map((lane, i) => (
          <div className="lane" key={i}>
            <img src={lane.image} alt="" className="target" />
            {notes
              .filter((n) => n.lane === i && !n.hit)
              .map((n, j) => {
                const y = (time - n.time) * speed;
                const visible = y >= 0 && y <= laneHeight;
                if (!visible) return null;
                return (
                  <img
                    key={j}
                    src={lane.image}
                    alt=""
                    className="note"
                    style={{ bottom: `${y}px` }}
                  />
                );
              })}
            <div className="lane-key">{lane.key.toUpperCase()}</div>
          </div>
        ))}
      </div>
      <div className="controls">
        <button className="start-button" onClick={handleStart}>
          Start
        </button>
        <button className="reset-button" onClick={handleReset}>
          Reset
        </button>
      </div>
    </div>
  );
}