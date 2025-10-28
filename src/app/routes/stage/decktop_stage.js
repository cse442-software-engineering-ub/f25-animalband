import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SOUND_CONFIG } from "./stage_soundsConfig";
import { loadSound, playSound, setMasterVolume } from "./stage_audioUtil";
import "./stage.css";

import Ostrich from "../../../assets/ostrich.png";
import OstrichPlaying from "../../../assets/ostrichrockin.png";
import Bird from "../../../assets/bird.png";
import BirdPlaying from "../../../assets/birdrockin.png";
import Hamster from "../../../assets/hamster.png";
import HamsterPlaying from "../../../assets/hamsterrockin.png";
import Kangaroo from "../../../assets/kangaroo.png";
import KangarooPlaying from "../../../assets/kangaroorockin.png";
import Snake from "../../../assets/snake.png";
import SnakePlaying from "../../../assets/snakerockin.png";

export default function DesktopStage() {
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

  // Handle key press
  useEffect(() => {
    const handleKeyDown = (e) => {
    // Prevent sound triggers while typing in text fields
    if (
      e.target.tagName === "INPUT" ||
      e.target.tagName === "TEXTAREA" ||
      e.target.isContentEditable
    ) {
      return;
    }

    const key = e.key.toLowerCase();
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

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sounds, masterVolume, isRecording, recordStartTime]);

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

  // Play all tracks simultaneously
  const playAllTracks = () => {
    if (!audioContextRef.current || recordedTracks.length === 0) return;
    setIsPlaying(true);
    const audioContext = audioContextRef.current;

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

  return (
    <div className="stagestuff">
      <div className="landing-page">
        <header className="header">
          <Link to="/" className="logo-section">
            <span className="material-symbols-outlined paw-icon">pets</span>
            <h1 className="site-title">ANIMALBAND</h1>
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
                style={{ width: "75px", height: "75px", borderRadius: "50%", cursor: "pointer", objectFit: "cover" }}
              />
            )}
          </div>
        </header>

        <section className="band-stage">
          <div className="animals-container">
            {Object.keys(ANIMAL_IMAGES).map(animal => (
              <div key={animal} className="animal-member">
                <img
                  src={playingAnimals[animal] ? ANIMAL_IMAGES[animal][1] : ANIMAL_IMAGES[animal][0]}
                  alt={`${animal} instrument`}
                  className={playingAnimals[animal] ? "playing" : ""}
                />
                <div className="animal-controls">
                  <p className="key-text">
                    {Object.entries({
                      hamster: "A S D F",
                      bird: "C V B N",
                      ostrich: "H J K L",
                      kangaroo: "U I O P",
                      snake: "Q W E R",
                    })[Object.keys(ANIMAL_IMAGES).indexOf(animal)][1]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom controls */}
        <div className="bottom-controls">
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

          <div className="circle-buttons">
            <button
              onClick={toggleRecording}
              className={`circle-btn ${isRecording ? "stop" : "record"}`}
            >
              {isRecording ? "■" : "●"}
            </button>

            <button
              onClick={playAllTracks}
              disabled={isRecording || recordedTracks.length === 0}
              className={`circle-btn play ${isPlaying ? "playing" : ""}`}
            >
              ►
            </button>

            <button
              onClick={exportRecording}
              disabled={recordedTracks.length === 0}
              className="circle-btn export"
            >
              ⬇
            </button>
          </div>
        </div>

        {/* Track list */}
        <div className="track-list">
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
                  style={{ marginRight: "10px" }}
                />
              ) : (
                <span onDoubleClick={() => startRename(index)}>
                  {trackSettings[index]?.name || `Track ${index + 1}`}
                </span>
              )}
              <div className="track-buttons">
                <button onClick={() => toggleMute(index)}>
                  {trackSettings[index]?.muted ? "Unmute" : "Mute"}
                </button>
                <button onClick={() => toggleSolo(index)}>
                  {trackSettings[index]?.solo ? "Unsolo" : "Solo"}
                </button>
                <button onClick={() => startRename(index)}>Rename</button>
                <button onClick={() => deleteTrack(index)}>Delete</button>
              </div>
            </div>
          ))}
        </div>

        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
          rel="stylesheet"
        />
      </div>
    </div>
  );
}

