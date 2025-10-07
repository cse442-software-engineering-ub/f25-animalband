import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SOUND_CONFIG } from "./stage_soundsConfig";
import { loadSound, playSound, setMasterVolume } from "./stage_audioUtil";
import "./stage.css";

import Ostrich from "../../../assets/ostrich.jpeg";
import OstrichPlaying from "../../../assets/ostrich_playing.jpeg";
import Bird from "../../../assets/bird.jpeg";
import BirdPlaying from "../../../assets/bird_playing.jpeg";
import Hamster from "../../../assets/hamster.jpeg";
import HamsterPlaying from "../../../assets/hamster_playing.jpeg";
import Kangaroo from "../../../assets/kangaroo.jpeg";
import KangarooPlaying from "../../../assets/kangaroo_playing.jpeg";
import Snake from "../../../assets/snake.jpeg";
import SnakePlaying from "../../../assets/snake_playing.jpeg";

export default function Stage() {
  const navigate = useNavigate();
  const [sounds, setSounds] = useState({});
  const [volumes, setVolumes] = useState({});
  const [masterVolume, setMasterVol] = useState(1);
  const [playingAnimals, setPlayingAnimals] = useState({});

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedNotes, setRecordedNotes] = useState([]);
  const [recordStartTime, setRecordStartTime] = useState(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);

  const audioContextRef = useRef(null);

  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
  }, []);

  const ANIMAL_IMAGES = {
    hamster: [Hamster, HamsterPlaying],
    bird: [Bird, BirdPlaying],
    ostrich: [Ostrich, OstrichPlaying],
    kangaroo: [Kangaroo, KangarooPlaying],
    snake: [Snake, SnakePlaying],
  };

  useEffect(() => {
    const loadAllSounds = async () => {
      const loadedSounds = {};
      const initialVolumes = {};
      for (const sound of SOUND_CONFIG) {
        loadedSounds[sound.key] = await loadSound(sound.file);
        initialVolumes[sound.key] = 1;
      }
      setSounds(loadedSounds);
      setVolumes(initialVolumes);
    };
    loadAllSounds();
  }, []);

  const handleVolumeChange = (key, value) => {
    setVolumes((prev) => ({ ...prev, [key]: parseFloat(value) }));
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (!sounds[key]) return;

      const animalMap = {
        a: "hamster", s: "hamster", d: "hamster", f: "hamster",
        c: "bird", v: "bird", b: "bird", n: "bird",
        h: "ostrich", j: "ostrich", k: "ostrich", l: "ostrich",
        u: "kangaroo", i: "kangaroo", o: "kangaroo", p: "kangaroo",
        q: "snake", w: "snake", e: "snake", r: "snake",
      };

      const animal = animalMap[key];
      if (!animal) return;

      if (isRecording) {
        const timeSinceStart = performance.now() - recordStartTime;
        setRecordedNotes((prev) => [...prev, { key, time: timeSinceStart }]);
      }

      const volume = (volumes[animal] || 1) * masterVolume;
      playSound(sounds[key], volume);

      setPlayingAnimals((prev) => ({ ...prev, [animal]: true }));
      setTimeout(() => {
        setPlayingAnimals((prev) => ({ ...prev, [animal]: false }));
      }, 300);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sounds, volumes, masterVolume, isRecording, recordStartTime]);

  useEffect(() => {
    const savedVol = parseFloat(localStorage.getItem("masterVolume") || "1");
    setMasterVol(savedVol);
    setMasterVolume(savedVol);
  }, []);

  useEffect(() => {
    localStorage.setItem("masterVolume", masterVolume);
  }, [masterVolume]);

  // Playback recorded sequence
  const playRecording = () => {
    if (recordedNotes.length === 0 || !audioContextRef.current) return;

    setIsPlaying(true);
    const audioContext = audioContextRef.current;
    const animalMap = {
      a: "hamster", s: "hamster", d: "hamster", f: "hamster",
      c: "bird", v: "bird", b: "bird", n: "bird",
      h: "ostrich", j: "ostrich", k: "ostrich", l: "ostrich",
      u: "kangaroo", i: "kangaroo", o: "kangaroo", p: "kangaroo",
      q: "snake", w: "snake", e: "snake", r: "snake",
    };

    recordedNotes.forEach(({ key, time }) => {
      const animal = animalMap[key];
      if (!animal || !sounds[key]) return;

      const volume = (volumes[animal] || 1) * masterVolume;

      const source = audioContext.createBufferSource();
      source.buffer = sounds[key];
      const gainNode = audioContext.createGain();
      gainNode.gain.value = volume;
      source.connect(gainNode).connect(audioContext.destination);
      source.start(audioContext.currentTime + time / 1000);

      setTimeout(() => {
        setPlayingAnimals((prev) => ({ ...prev, [animal]: true }));
        setTimeout(() => {
          setPlayingAnimals((prev) => ({ ...prev, [animal]: false }));
        }, 300);
      }, time);
    });

    // Reset play state after last note
    const totalTime = recordedNotes[recordedNotes.length - 1].time + 400;
    setTimeout(() => setIsPlaying(false), totalTime);
  };

  return (
    <div className="landing-page">
      <header className="header">
        <Link to="/" className="logo-section">
          <span className="material-symbols-outlined paw-icon">pets</span>
          <h1 className="site-title">ANIMALBAND</h1>
        </Link>

        <div className="header-buttons">
          <button className="btn-login" onClick={() => navigate("/login")}>
            Login
          </button>
          <button className="btn-register" onClick={() => navigate("/register")}>
            Register
          </button>
        </div>
      </header>

      <section className="band-stage">
        <h2 className="main-heading">Stage</h2>
        <p className="subtitle">
          Press your keyboard to play instruments. Adjust volumes below!
        </p>

        <div className="animals-container">
          {Object.keys(ANIMAL_IMAGES).map((animal) => (
            <div key={animal} className="animal-member">
              <img
                src={playingAnimals[animal] ? ANIMAL_IMAGES[animal][1] : ANIMAL_IMAGES[animal][0]}
                alt={`${animal} instrument`}
              />
              <div className="animal-controls">
                <p className="key-text">
                  {
                    Object.entries({
                      hamster: "A S D F",
                      bird: "C V B N",
                      ostrich: "H J K L",
                      kangaroo: "U I O P",
                      snake: "Q W E R",
                    })[Object.keys(ANIMAL_IMAGES).indexOf(animal)][1]
                  }
                </p>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volumes[animal] || 1}
                  onChange={(e) => handleVolumeChange(animal, e.target.value)}
                  className="animal-volume-slider"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="master-volume">
          <label>Master Volume: {(masterVolume * 100).toFixed(0)}%</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={masterVolume}
            onChange={(e) => {
              const newVol = parseFloat(e.target.value);
              setMasterVol(newVol);
              setMasterVolume(newVol);
            }}
          />
        </div>

        <div className="record-controls">
          <button
            onClick={() => {
              if (!isRecording) {
                setRecordedNotes([]);
                setRecordStartTime(performance.now());
                setIsRecording(true);
              } else {
                setIsRecording(false);
              }
            }}
            className={`record-btn ${isRecording ? "stop" : "start"}`}
          >
            <span className="record-symbol">{isRecording ? "■" : "●"}</span>
            {isRecording ? "Stop Recording" : "Start Recording"}
          </button>

          <button
            onClick={playRecording}
            disabled={isRecording || recordedNotes.length === 0}
            className={`record-btn play ${isPlaying ? "playing" : ""}`}
          >
            <span className="record-symbol">►</span>
            {isPlaying ? "Playing..." : "Play Recording"}
          </button>
        </div>
      </section>

      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
        rel="stylesheet"
      />
    </div>
  );
}
