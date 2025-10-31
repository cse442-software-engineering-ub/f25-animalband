import { useState, useEffect, useRef } from "react";

import Ostrich from "../../../assets/ostrich.png";
import Bird from "../../../assets/bird.png";
import Hamster from "../../../assets/hamster.png";
import Kangaroo from "../../../assets/kangaroo.png";
import Snake from "../../../assets/snake.png";

const ostrichSound = "../../../public/stage_sounds/keys/temp_keys_CM.wav";
const birdSound = "../../../public/stage_sounds/vocal/double_chirp.wav";
const hamsterSound = "../../../public/stage_sounds/drums/Snare_temp.wav";
const kangarooSound = "../../../public/stage_sounds/guitar/temp_guitar_CM.wav";
const snakeSound = "../../../public/stage_sounds/bass/temp_bass_G.wav";

const LANES = [
  { key: "h", animal: Ostrich, sound: ostrichSound },
  { key: "c", animal: Bird, sound: birdSound },
  { key: "a", animal: Hamster, sound: hamsterSound },
  { key: "u", animal: Kangaroo, sound: kangarooSound },
  { key: "q", animal: Snake, sound: snakeSound },
];

const NOTES = [
  { lane: 0, time: 1000 },
  { lane: 2, time: 1500 },
  { lane: 1, time: 2000 },
  { lane: 4, time: 2500 },
];

export default function RhythmGame() {
  const [time, setTime] = useState(0);
  const [notes, setNotes] = useState(NOTES);
  const startTime = useRef(null);
  const raf = useRef(null);

  useEffect(() => {
    const update = (t) => {
      if (!startTime.current) startTime.current = t;
      const elapsed = t - startTime.current;
      setTime(elapsed);
      raf.current = requestAnimationFrame(update);
    };
    raf.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  const handleKeyDown = (e) => {
    const lane = LANES.findIndex((l) => l.key === e.key);
    if (lane === -1) return;

    const note = notes.find(
      (n) => n.lane === lane && !n.hit && Math.abs(n.time - time) < 300
    );
    if (note) {
      new Audio(LANES[lane].sound).play();
      note.hit = true;
      setNotes([...notes]);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [time, notes]);

  const speed = 0.3; // pixels per ms

  return (
    <div className="game">
      <div className="lanes">
        {LANES.map((lane, i) => (
          <div className="lane" key={i}>
            {/* target (transparent) */}
            <img
              src={lane.animal}
              alt=""
              className="target"
              style={{ opacity: 0.2 }}
            />
            {/* moving notes */}
            {notes
              .filter((n) => n.lane === i && !n.hit)
              .map((n, j) => {
                const y = 400 - (n.time - time) * speed; // move up
                return (
                  <img
                    key={j}
                    src={lane.animal}
                    alt=""
                    className="note"
                    style={{
                      position: "absolute",
                      bottom: `${y}px`,
                      transition: "none",
                    }}
                  />
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
}
