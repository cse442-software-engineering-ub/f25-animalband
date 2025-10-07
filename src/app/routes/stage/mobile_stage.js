import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SOUND_CONFIG } from "./stage_soundsConfig";
import { loadSound, playSound, setMasterVolume } from "./stage_audioUtil";
import "./mobile_stage.css";

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

export default function MobileStage() {
  const navigate = useNavigate();
  const [sounds, setSounds] = useState({});
  const [volumes, setVolumes] = useState({});
  const [masterVolume, setMasterVol] = useState(1);
  const [playingAnimals, setPlayingAnimals] = useState({});
  const [isRecording, setIsRecording] = useState(false);
  const [recordedNotes, setRecordedNotes] = useState([]);
  const [recordStartTime, setRecordStartTime] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef(null);

  const ANIMAL_IMAGES = {
    hamster: [Hamster, HamsterPlaying],
    bird: [Bird, BirdPlaying],
    ostrich: [Ostrich, OstrichPlaying],
    kangaroo: [Kangaroo, KangarooPlaying],
    snake: [Snake, SnakePlaying],
  };

  const ANIMAL_KEYS = {
    hamster: ["a","s","d","f"],
    bird: ["c","v","b","n"],
    ostrich: ["h","j","k","l"],
    kangaroo: ["u","i","o","p"],
    snake: ["q","w","e","r"],
  };

  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
  }, []);

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

  const handleTap = (key) => {
    if (!sounds[key]) return;

    const animalMap = {
      a:"hamster", s:"hamster", d:"hamster", f:"hamster",
      c:"bird", v:"bird", b:"bird", n:"bird",
      h:"ostrich", j:"ostrich", k:"ostrich", l:"ostrich",
      u:"kangaroo", i:"kangaroo", o:"kangaroo", p:"kangaroo",
      q:"snake", w:"snake", e:"snake", r:"snake",
    };

    const animal = animalMap[key];
    if (!animal) return;

    const volume = (volumes[animal] || 1) * masterVolume;
    playSound(sounds[key], volume);

    setPlayingAnimals((prev) => ({ ...prev, [animal]: true }));
    setTimeout(() => setPlayingAnimals((prev) => ({ ...prev, [animal]: false })), 300);

    if (isRecording) {
      const timeSinceStart = performance.now() - recordStartTime;
      setRecordedNotes((prev) => [...prev, { key, time: timeSinceStart }]);
    }
  };

  const playRecording = () => {
    if (recordedNotes.length === 0 || !audioContextRef.current) return;

    setIsPlaying(true);
    const audioContext = audioContextRef.current;

    recordedNotes.forEach(({ key, time }) => {
      if (!sounds[key]) return;
      const animalMap = {
        a:"hamster", s:"hamster", d:"hamster", f:"hamster",
        c:"bird", v:"bird", b:"bird", n:"bird",
        h:"ostrich", j:"ostrich", k:"ostrich", l:"ostrich",
        u:"kangaroo", i:"kangaroo", o:"kangaroo", p:"kangaroo",
        q:"snake", w:"snake", e:"snake", r:"snake",
      };
      const animal = animalMap[key];
      if (!animal) return;

      const volume = (volumes[animal] || 1) * masterVolume;

      const source = audioContext.createBufferSource();
      source.buffer = sounds[key];
      const gainNode = audioContext.createGain();
      gainNode.gain.value = volume;
      source.connect(gainNode).connect(audioContext.destination);
      source.start(audioContext.currentTime + time / 1000);

      setTimeout(() => {
        setPlayingAnimals((prev) => ({ ...prev, [animal]: true }));
        setTimeout(() => setPlayingAnimals((prev) => ({ ...prev, [animal]: false })), 300);
      }, time);
    });

    const totalTime = recordedNotes[recordedNotes.length - 1].time + 400;
    setTimeout(() => setIsPlaying(false), totalTime);
  };

  useEffect(() => {
    const savedVol = parseFloat(localStorage.getItem("masterVolume") || "1");
    setMasterVol(savedVol);
    setMasterVolume(savedVol);
  }, []);

  useEffect(() => {
    localStorage.setItem("masterVolume", masterVolume);
  }, [masterVolume]);

  return (
    <div className="m-landing-page">
      <header className="m-header">
        <Link to="/" className="m-site-title">
          <span className="material-symbols-outlined m-paw">pets</span>
          <h1 className="m-name">ANIMALBAND</h1>
        </Link>
        <div className="header-buttons">
          <button className="btn-login" onClick={() => navigate("/login")}>Login</button>
          <button className="btn-register" onClick={() => navigate("/register")}>Register</button>
        </div>
      </header>

      <section className="m-band-stage">
        <h2 className="main-heading">Stage</h2>
        <p className="subtitle">Tap on the animals in different quadrants!</p>

        <div className="m-animal-grid">
          {Object.keys(ANIMAL_IMAGES).map((animal) => (
            <div key={animal} className="m-animal-cell">
              <img
                src={playingAnimals[animal] ? ANIMAL_IMAGES[animal][1] : ANIMAL_IMAGES[animal][0]}
                alt={animal}
              />
              {ANIMAL_KEYS[animal].map((key, i) => (
                <div
                  key={i}
                  className={`m-quadrant quadrant-${i}`}
                  onClick={() => handleTap(key)}
                />
              ))}
              {/* <input    // individual volume control doesnt work right removed to declutter the screen
                type="range"
                min="0" max="1" step="0.01"
                value={volumes[animal] || 1}
                onChange={(e) => handleVolumeChange(animal, e.target.value)}
                className="animal-volume-slider"
              /> */}
            </div>
          ))}
        </div>

        <div className="master-volume">
          <label>Master Volume: {(masterVolume*100).toFixed(0)}%</label>
          <input
            type="range"
            min="0" max="1" step="0.01"
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
              } else setIsRecording(false);
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

      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
    </div>
  );
}
