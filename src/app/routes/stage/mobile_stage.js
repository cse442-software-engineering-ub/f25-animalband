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
  const [masterVolume, setMasterVol] = useState(1);
  const [playingAnimals, setPlayingAnimals] = useState({});

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedTracks, setRecordedTracks] = useState([]); // multiple tracks
  const [currentTrack, setCurrentTrack] = useState([]);
  const [recordStartTime, setRecordStartTime] = useState(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);

  // Track settings: name, mute, solo
  const [trackSettings, setTrackSettings] = useState([]);
  const [editingTrack, setEditingTrack] = useState(null);
  const [editingName, setEditingName] = useState("");

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

  const animalKeyMap = {
    a: "hamster", s: "hamster", d: "hamster", f: "hamster",
    c: "bird", v: "bird", b: "bird", n: "bird",
    h: "ostrich", j: "ostrich", k: "ostrich", l: "ostrich",
    u: "kangaroo", i: "kangaroo", o: "kangaroo", p: "kangaroo",
    q: "snake", w: "snake", e: "snake", r: "snake",
  };

  // Fetch user
  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await fetch(
          "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/shabad/php/getUser.php",
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

  // Load sounds
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

  // Handle tap
  const handleTap = (key) => {
    if (!sounds[key]) return;

    const animal = animalKeyMap[key];
    if (!animal) return;

    if (isRecording) {
      const timeSinceStart = performance.now() - recordStartTime;
      setCurrentTrack(prev => [...prev, { key, time: timeSinceStart }]);
    }

    playSound(sounds[key], masterVolume);
    setPlayingAnimals(prev => ({ ...prev, [animal]: true }));
    setTimeout(() => setPlayingAnimals(prev => ({ ...prev, [animal]: false })), 300);
  };

  // Load master volume
  useEffect(() => {
    const savedVol = parseFloat(localStorage.getItem("masterVolume") || "1");
    setMasterVol(savedVol);
    setMasterVolume(savedVol);
  }, []);

  useEffect(() => {
    localStorage.setItem("masterVolume", masterVolume);
  }, [masterVolume]);

  // Start/stop recording with overdub playback
  const toggleRecording = () => {
    if (!isRecording) {
      setCurrentTrack([]);
      setRecordStartTime(performance.now());
      setIsRecording(true);
      // Play existing tracks while recording
      if (recordedTracks.length > 0) playTracksDuringRecording();
    } else {
      setRecordedTracks(prev => {
        const newTracks = [...prev, currentTrack];
        setTrackSettings(prevSettings => [
          ...prevSettings,
          { name: `Track ${newTracks.length}`, muted: false, solo: false }
        ]);
        return newTracks;
      });
      setIsRecording(false);
    }
  };

  // Play existing tracks during recording
  const playTracksDuringRecording = () => {
    if (!audioContextRef.current) return;
    const audioContext = audioContextRef.current;

    recordedTracks.forEach(track => {
      track.forEach(({ key, time }) => {
        if (!sounds[key]) return;
        const animal = animalKeyMap[key];
        const source = audioContext.createBufferSource();
        source.buffer = sounds[key];

        const gainNode = audioContext.createGain();
        gainNode.gain.value = masterVolume;

        source.connect(gainNode).connect(audioContext.destination);
        source.start(audioContext.currentTime + time / 1000);

        setTimeout(() => {
          setPlayingAnimals(prev => ({ ...prev, [animal]: true }));
          setTimeout(() => setPlayingAnimals(prev => ({ ...prev, [animal]: false })), 300);
        }, time);
      });
    });
  };

  // Play all tracks simultaneously with mute/solo logic
  const playAllTracks = () => {
    if (!audioContextRef.current || recordedTracks.length === 0) return;
    setIsPlaying(true);
    const audioContext = audioContextRef.current;

    // Determine which tracks to play based on mute/solo
    const anySolo = trackSettings.some(t => t.solo);
    const activeTracks = recordedTracks
      .map((track, i) => ({ track, settings: trackSettings[i] }))
      .filter(({ settings }) => anySolo ? settings.solo : !settings.muted);

    activeTracks.forEach(({ track }) => {
      track.forEach(({ key, time }) => {
        if (!sounds[key]) return;
        const animal = animalKeyMap[key];
        const source = audioContext.createBufferSource();
        source.buffer = sounds[key];

        const gainNode = audioContext.createGain();
        gainNode.gain.value = masterVolume;

        source.connect(gainNode).connect(audioContext.destination);
        source.start(audioContext.currentTime + time / 1000);

        setTimeout(() => {
          setPlayingAnimals(prev => ({ ...prev, [animal]: true }));
          setTimeout(() => setPlayingAnimals(prev => ({ ...prev, [animal]: false })), 300);
        }, time);
      });
    });

    const longestTrack = Math.max(...recordedTracks.map(track => track.length ? track[track.length - 1].time : 0));
    setTimeout(() => setIsPlaying(false), longestTrack + 400);
  };

  // Delete a track
  const deleteTrack = (index) => {
    setRecordedTracks(prev => prev.filter((_, i) => i !== index));
    setTrackSettings(prev => prev.filter((_, i) => i !== index));
  };

  // Track control functions
  const toggleMute = (index) => {
    setTrackSettings(prev => prev.map((t, i) =>
      i === index ? { ...t, muted: !t.muted, solo: false } : t
    ));
  };

  const toggleSolo = (index) => {
    setTrackSettings(prev => prev.map((t, i) =>
      i === index ? { ...t, solo: !t.solo } : t
    ));
  };

  const startRename = (index) => {
    setEditingTrack(index);
    setEditingName(trackSettings[index]?.name || `Track ${index + 1}`);
  };

  const finishRename = (index) => {
    if (editingName.trim()) {
      setTrackSettings(prev => prev.map((t, i) =>
        i === index ? { ...t, name: editingName.trim() } : t
      ));
    }
    setEditingTrack(null);
  };

  // Export combined tracks
  const exportRecording = async () => {
    if (!audioContextRef.current || recordedTracks.length === 0) return;

    const fileName = prompt("Enter a name for your recording:", "animalband_recording");
    if (!fileName) return;

    const allNotes = recordedTracks.flat();
    const duration = (allNotes.length ? allNotes[allNotes.length - 1].time + 1000 : 0) / 1000;
    const offlineCtx = new OfflineAudioContext(2, 44100 * duration, 44100);

    allNotes.forEach(({ key, time }) => {
      const buffer = sounds[key];
      if (!buffer) return;
      const source = offlineCtx.createBufferSource();
      source.buffer = buffer;

      const gainNode = offlineCtx.createGain();
      gainNode.gain.value = masterVolume;

      source.connect(gainNode).connect(offlineCtx.destination);
      source.start(time / 1000);
    });

    const renderedBuffer = await offlineCtx.startRendering();
    const wavBlob = bufferToWav(renderedBuffer);

    const url = URL.createObjectURL(wavBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName.trim() || "animalband_recording"}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // WAV conversion helpers
  function bufferToWav(buffer) {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);

    const writeString = (view, offset, string) => {
      for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
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
    <div className="m-landing-page">
      <header className="m-header">
        <div className="m-site-title">
          <span className="material-symbols-outlined m-paw">pets</span>
          <h1 className="m-name">ANIMALBAND</h1>
        </div>

        <div className="header-buttons">
          {!user ? (
            <>
              <button className="btn-login" onClick={() => navigate("/login")}>Login</button>
              <button className="btn-register" onClick={() => navigate("/register")}>Register</button>
            </>
          ) : (
            <img
              src={`https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/shabad/php/${user.profilePic}`}
              alt="Profile"
              className="profile-pic"
              onClick={() => navigate("/account")}
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
                className={playingAnimals[animal] ? "playing" : ""}
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

        {/* Bottom controls */}
        <div className="master-volume">
          <label>Master Volume: {(masterVolume * 100).toFixed(0)}%</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={masterVolume}
            onChange={e => {
              const newVol = parseFloat(e.target.value);
              setMasterVol(newVol);
              setMasterVolume(newVol);
            }}
            className="volume-slider"
          />
        </div>

        <div className="record-controls">
          <button
            onClick={toggleRecording}
            className={`record-btn ${isRecording ? "stop" : "start"}`}
          >
            <span className="record-symbol">{isRecording ? "■" : "●"}</span>
            {isRecording ? "Stop Recording" : "Start Recording"}
          </button>

          <button
            onClick={playAllTracks}
            disabled={isRecording || recordedTracks.length === 0}
            className={`record-btn play ${isPlaying ? "playing" : ""}`}
          >
            <span className="record-symbol">►</span>
            {isPlaying ? "Playing..." : "Play Recording"}
          </button>

          <button
            onClick={exportRecording}
            disabled={recordedTracks.length === 0}
            className="record-btn export"
          >
            <span className="material-symbols-outlined">file_download</span>
            Export
          </button>
        </div>

        {/* Track list */}
        <div className="tracks-list">
          <h3>Recorded Tracks</h3>
          {recordedTracks.length === 0 && <p>No tracks yet.</p>}
          {recordedTracks.map((track, index) => (
            <div key={index} className="track-item">
              {editingTrack === index ? (
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={() => finishRename(index)}
                  onKeyDown={(e) => e.key === "Enter" && finishRename(index)}
                  autoFocus
                  style={{ marginRight: "10px", padding: "4px", fontSize: "14px" }}
                />
              ) : (
                <span onDoubleClick={() => startRename(index)} style={{ flexGrow: 1 }}>
                  {trackSettings[index]?.name || `Track ${index + 1}`}
                </span>
              )}
              <div className="track-buttons">
                <button onClick={() => toggleMute(index)} style={{ 
                  backgroundColor: trackSettings[index]?.muted ? "#ff6b6b" : "#e0e0e0",
                  padding: "4px 8px",
                  fontSize: "12px"
                }}>
                  {trackSettings[index]?.muted ? "Unmute" : "Mute"}
                </button>
                <button onClick={() => toggleSolo(index)} style={{ 
                  backgroundColor: trackSettings[index]?.solo ? "#51cf66" : "#e0e0e0",
                  padding: "4px 8px",
                  fontSize: "12px"
                }}>
                  {trackSettings[index]?.solo ? "Unsolo" : "Solo"}
                </button>
                <button onClick={() => startRename(index)} style={{ padding: "4px 8px", fontSize: "12px" }}>
                  Rename
                </button>
                <button onClick={() => deleteTrack(index)} style={{ padding: "4px 8px", fontSize: "12px" }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
        rel="stylesheet"
      />
    </div>
  );
}