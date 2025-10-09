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

export default function DesktopStage() {
  console.log("📺 Desktop stage mounted");

  const navigate = useNavigate();
  const [sounds, setSounds] = useState({});
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
      for (const sound of SOUND_CONFIG) {
        loadedSounds[sound.key] = await loadSound(sound.file);
      }
      setSounds(loadedSounds);
    };
    loadAllSounds();
  }, []);

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

      playSound(sounds[key], masterVolume);

      setPlayingAnimals((prev) => ({ ...prev, [animal]: true }));
      setTimeout(() => {
        setPlayingAnimals((prev) => ({ ...prev, [animal]: false }));
      }, 300);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sounds, masterVolume, isRecording, recordStartTime]);

  useEffect(() => {
    const savedVol = parseFloat(localStorage.getItem("masterVolume") || "1");
    setMasterVol(savedVol);
    setMasterVolume(savedVol);
  }, []);

  useEffect(() => {
    localStorage.setItem("masterVolume", masterVolume);
  }, [masterVolume]);

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

      const source = audioContext.createBufferSource();
      source.buffer = sounds[key];
      const gainNode = audioContext.createGain();
      gainNode.gain.value = masterVolume;
      source.connect(gainNode).connect(audioContext.destination);
      source.start(audioContext.currentTime + time / 1000);

      setTimeout(() => {
        setPlayingAnimals((prev) => ({ ...prev, [animal]: true }));
        setTimeout(() => {
          setPlayingAnimals((prev) => ({ ...prev, [animal]: false }));
        }, 300);
      }, time);
    });

    const totalTime = recordedNotes[recordedNotes.length - 1].time + 400;
    setTimeout(() => setIsPlaying(false), totalTime);
  };

  const exportRecording = async () => {
    if (recordedNotes.length === 0 || !audioContextRef.current) return;

    const fileName = prompt("Enter a name for your recording:", "animalband_recording");
    if (!fileName) return;

    const duration =
      (recordedNotes[recordedNotes.length - 1].time + 1000) / 1000;
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
      gainNode.gain.value = masterVolume;

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

  function bufferToWav(buffer) {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);

    const writeString = (view, offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    let offset = 0;

    writeString(view, offset, "RIFF"); offset += 4;
    view.setUint32(offset, 36 + buffer.length * numOfChan * 2, true); offset += 4;
    writeString(view, offset, "WAVE"); offset += 4;
    writeString(view, offset, "fmt "); offset += 4;
    view.setUint32(offset, 16, true); offset += 4;
    view.setUint16(offset, 1, true); offset += 2;
    view.setUint16(offset, numOfChan, true); offset += 2;
    view.setUint32(offset, buffer.sampleRate, true); offset += 4;
    view.setUint32(offset, buffer.sampleRate * 2 * numOfChan, true); offset += 4;
    view.setUint16(offset, numOfChan * 2, true); offset += 2;
    view.setUint16(offset, 16, true); offset += 2;
    writeString(view, offset, "data"); offset += 4;
    view.setUint32(offset, buffer.length * numOfChan * 2, true); offset += 4;

    const interleaved = interleave(buffer);
    let index = 44;
    for (let i = 0; i < interleaved.length; i++, index += 2) {
      const sample = Math.max(-1, Math.min(1, interleaved[i]));
      view.setInt16(index, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    }

    return new Blob([view], { type: "audio/wav" });
  }

  function interleave(buffer) {
    const inputL = buffer.getChannelData(0);
    const inputR = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : inputL;
    const interleaved = new Float32Array(buffer.length * 2);
    for (let i = 0, j = 0; i < buffer.length; i++, j += 2) {
      interleaved[j] = inputL[i];
      interleaved[j + 1] = inputR[i];
    }
    return interleaved;
  }

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

          <button
            onClick={exportRecording}
            disabled={recordedNotes.length === 0}
            className="record-btn export"
          >
            <span className="material-symbols-outlined export-icon">file_download</span>
            Export to WAV
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

