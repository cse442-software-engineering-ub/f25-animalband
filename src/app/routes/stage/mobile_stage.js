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
  const [tracks, setTracks] = useState([]);
  const [exportFilename, setExportFilename] = useState("animal_band_recording");

  const trackIdRef = useRef(1);
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

  const animalMap = {
    a: "hamster", s: "hamster", d: "hamster", f: "hamster",
    c: "bird", v: "bird", b: "bird", n: "bird",
    h: "ostrich", j: "ostrich", k: "ostrich", l: "ostrich",
    u: "kangaroo", i: "kangaroo", o: "kangaroo", p: "kangaroo",
    q: "snake", w: "snake", e: "snake", r: "snake",
  };

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

  const playNotes = (notes) => {
    if (!audioContextRef.current) return;
    const audioContext = audioContextRef.current;

    notes.forEach(({ key, time }) => {
      if (!sounds[key]) return;

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
  };

  const playTracksWhileRecording = () => {
    tracks.forEach(track => playNotes(track.notes));
  };

  const playRecording = () => {
    if (recordedNotes.length === 0 && tracks.length === 0) return;

    setIsPlaying(true);

    tracks.forEach(track => playNotes(track.notes));
    playNotes(recordedNotes);

    const allNotes = [...tracks.flatMap(t => t.notes), ...recordedNotes];
    const totalTime = allNotes.length > 0 ? Math.max(...allNotes.map(n => n.time)) + 400 : 0;
    setTimeout(() => setIsPlaying(false), totalTime);
  };

  const saveTrack = () => {
    if (recordedNotes.length === 0) return;
    setTracks((prev) => [...prev, { id: prev.length + 1, notes: recordedNotes }]);
  };

  const deleteTrack = (id) => {
    setTracks((prev) => prev.filter(t => t.id !== id));
  };

  // WAV export helpers
  const floatTo16BitPCM = (output, offset, input) => {
    for (let i = 0; i < input.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, input[i]));
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
  };

  const writeWAV = (samples, sampleRate) => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    const writeString = (view, offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, "WAVE");
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, "data");
    view.setUint32(40, samples.length * 2, true);

    floatTo16BitPCM(view, 44, samples);
    return buffer;
  };

  const mixTracksToBuffer = async () => {
    const sampleRate = 44100;
    let totalTime = 0;

    const allNotes = [...tracks.flatMap(t => t.notes), ...recordedNotes];
    if (allNotes.length === 0) return null;

    totalTime = Math.max(...allNotes.map(n => n.time)) / 1000 + 1;
    const outputBuffer = new Float32Array(totalTime * sampleRate);

    for (const { key, time } of allNotes) {
      const soundBuffer = sounds[key];
      if (!soundBuffer) continue;

      const startSample = Math.floor((time / 1000) * sampleRate);
      const inputData = soundBuffer.getChannelData(0);

      for (let i = 0; i < inputData.length; i++) {
        if (startSample + i < outputBuffer.length) {
          const animal = animalMap[key];
          const volume = (volumes[animal] || 1) * masterVolume;
          outputBuffer[startSample + i] += inputData[i] * volume;
        }
      }
    }
    return outputBuffer;
  };

  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportTracks = async () => {
    const buffer = await mixTracksToBuffer();
    if (!buffer) return alert("No tracks to export");

    const wavArrayBuffer = writeWAV(buffer, 44100);
    const blob = new Blob([wavArrayBuffer], { type: "audio/wav" });

    const filename = exportFilename.trim() ? `${exportFilename.trim()}.wav` : "animal_band_recording.wav";
    downloadBlob(blob, filename);
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

                // Start overdubbing
                playTracksWhileRecording();
              } else {
                setIsRecording(false);
                saveTrack();
              }
            }}
            className={`record-btn ${isRecording ? "stop" : "start"}`}
          >
            <span className="record-symbol">{isRecording ? "■" : "●"}</span>
            {isRecording ? "Stop Recording" : "Start Recording"}
          </button>

          <button
            onClick={playRecording}
            disabled={isRecording || (recordedNotes.length === 0 && tracks.length === 0)}
            className={`record-btn play ${isPlaying ? "playing" : ""}`}
          >
            <span className="record-symbol">►</span>
            {isPlaying ? "Playing..." : "Play Recording"}
          </button>

          <div className="export-controls" style={{ marginTop: "10px" }}>
            <input
              type="text"
              value={exportFilename}
              onChange={(e) => setExportFilename(e.target.value)}
              placeholder="Enter file name"
              style={{ marginRight: "10px", padding: "5px" }}
            />
            <button
              onClick={exportTracks}
              className="record-btn export"
            >
              <span className="material-symbols-outlined export-icon">file_download</span>
              Export Tracks
            </button>
          </div>
        </div>

        <div className="tracks-list" style={{ marginTop: "20px" }}>
          <h3>Recorded Tracks</h3>
          {tracks.length === 0 ? (
            <p>No tracks yet.</p>
          ) : (
            <ul>
              {tracks.map(track => (
                <li key={track.id}>
                  Track {track.id}
                  <button onClick={() => deleteTrack(track.id)} style={{ marginLeft: "10px" }}>Delete</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
    </div>
  );
}
