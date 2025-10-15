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
  const [user, setUser] = useState(null);
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
    hamster: ["a", "s", "d", "f"],
    bird: ["c", "v", "b", "n"],
    ostrich: ["h", "j", "k", "l"],
    kangaroo: ["u", "i", "o", "p"],
    snake: ["q", "w", "e", "r"],
  };

  // Fetch user info
  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await fetch(
          "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php/getUser.php",
          { credentials: "include" }
        );
        const data = await res.json();
        if (data.loggedIn) setUser(data);
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    };
    checkUser();
  }, []);

  // Initialize AudioContext
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
  }, []);

  // Load all sounds
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
      a: "hamster", s: "hamster", d: "hamster", f: "hamster",
      c: "bird", v: "bird", b: "bird", n: "bird",
      h: "ostrich", j: "ostrich", k: "ostrich", l: "ostrich",
      u: "kangaroo", i: "kangaroo", o: "kangaroo", p: "kangaroo",
      q: "snake", w: "snake", e: "snake", r: "snake",
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
        a: "hamster", s: "hamster", d: "hamster", f: "hamster",
        c: "bird", v: "bird", b: "bird", n: "bird",
        h: "ostrich", j: "ostrich", k: "ostrich", l: "ostrich",
        u: "kangaroo", i: "kangaroo", o: "kangaroo", p: "kangaroo",
        q: "snake", w: "snake", e: "snake", r: "snake",
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

  // Convert AudioBuffer to WAV
  function bufferToWav(abuffer) {
    const numOfChan = abuffer.numberOfChannels;
    const length = abuffer.length * numOfChan * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    const channels = [];
    let pos = 0;

    function setUint16(data) { view.setUint16(pos, data, true); pos += 2; }
    function setUint32(data) { view.setUint32(pos, data, true); pos += 4; }

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8);
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt "
    setUint32(16);
    setUint16(1);
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);
    setUint32(0x61746164); // "data"
    setUint32(length - pos - 4);

    for (let i = 0; i < numOfChan; i++) channels.push(abuffer.getChannelData(i));

    let offset = 0;
    while (pos < length) {
      for (let i = 0; i < numOfChan; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]));
        view.setInt16(pos, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([buffer], { type: "audio/wav" });
  }

  const exportRecording = async () => {
    if (recordedNotes.length === 0 || !audioContextRef.current) return;

    const fileName = prompt("Enter a name for your recording:", "animalband_recording");
    if (!fileName) return;

    const duration = (recordedNotes[recordedNotes.length - 1].time + 1000) / 1000;
    const offlineCtx = new OfflineAudioContext(2, 44100 * duration, 44100);

    const animalMap = {
      a: "hamster", s: "hamster", d: "hamster", f: "hamster",
      c: "bird", v: "bird", b: "bird", n: "bird",
      h: "ostrich", j: "ostrich", k: "ostrich", l: "ostrich",
      u: "kangaroo", i: "kangaroo", o: "kangaroo", p: "kangaroo",
      q: "snake", w: "snake", e: "snake", r: "snake",
    };

    for (const { key, time } of recordedNotes) {
      const buffer = sounds[key];
      if (!buffer) continue;

      const source = offlineCtx.createBufferSource();
      source.buffer = buffer;
      const gainNode = offlineCtx.createGain();
      const animal = animalMap[key];
      const volume = (volumes[animal] || 1) * masterVolume;
      gainNode.gain.value = volume;

      source.connect(gainNode).connect(offlineCtx.destination);
      source.start(time / 1000);
    }

    const renderedBuffer = await offlineCtx.startRendering();
    const wavBlob = bufferToWav(renderedBuffer);

    const url = URL.createObjectURL(wavBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName.trim() || "animalband_recording"}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="m-landing-page">
      <header className="m-header">
        <Link to="/" className="m-site-title">
          <span className="material-symbols-outlined m-paw">pets</span>
          <h1 className="m-name">ANIMALBAND</h1>
        </Link>
        <div className="header-buttons">
          {!user ? (
            <>
              <button className="btn-login" onClick={() => navigate("/login")}>Login</button>
              <button className="btn-register" onClick={() => navigate("/register")}>Register</button>
            </>
          ) : (
            <img
              src={`https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php/${user.profilePic}`}
              alt="Profile"
              className="profile-pic"
              onClick={() => navigate("/account")}
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                cursor: "pointer",
                objectFit: "cover",
              }}
            />
          )}
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

          <button
            onClick={exportRecording}
            disabled={isRecording || recordedNotes.length === 0}
            className="record-btn export"
          >
            <span className="material-symbols-outlined export-icon">file_download</span>
            Export Recording
          </button>
        </div>
      </section>

      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
    </div>
  );
}
