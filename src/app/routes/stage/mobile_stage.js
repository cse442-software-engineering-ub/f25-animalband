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
  const [importedAudioBuffers, setImportedAudioBuffers] = useState([]); // Store imported audio buffers
  const [trackCounter, setTrackCounter] = useState(1); // Track numbering counter

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeAudioSources, setActiveAudioSources] = useState([]); // Track active audio sources

  // Track settings: name, mute, solo, volume
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
      const trackName = `Track ${trackCounter}`;
      setRecordedTracks(prev => [...prev, currentTrack]);
      setTrackSettings(prev => [
        ...prev,
        { name: trackName, muted: false, solo: false, volume: 1 }
      ]);
      setTrackCounter(c => c + 1); // Increment counter after creating track
      setIsRecording(false);
      
      // Stop any playing tracks when stopping recording
      stopPlayback();
    }
  };

  // Play existing tracks during recording
  const playTracksDuringRecording = () => {
    if (!audioContextRef.current) return;
    const audioContext = audioContextRef.current;

    const sources = []; // Collect all audio sources
    const timeouts = []; // Collect all timeouts

    recordedTracks.forEach((track, trackIndex) => {
      const trackVolume = trackSettings[trackIndex]?.volume ?? 1;
      track.forEach(({ key, time, isImported, audioBuffer }) => {
        if (isImported && audioBuffer) {
          // Play imported audio
          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;
          const gainNode = audioContext.createGain();
          gainNode.gain.value = masterVolume * trackVolume;
          source.connect(gainNode).connect(audioContext.destination);
          source.start(audioContext.currentTime + time / 1000);
          sources.push(source);
        } else if (!sounds[key]) {
          return;
        } else {
          const animal = animalKeyMap[key];
          const source = audioContext.createBufferSource();
          source.buffer = sounds[key];

          const gainNode = audioContext.createGain();
          gainNode.gain.value = masterVolume * trackVolume;

          source.connect(gainNode).connect(audioContext.destination);
          source.start(audioContext.currentTime + time / 1000);
          sources.push(source);

          const timeout1 = setTimeout(() => {
            setPlayingAnimals(prev => ({ ...prev, [animal]: true }));
            const timeout2 = setTimeout(() => setPlayingAnimals(prev => ({ ...prev, [animal]: false })), 300);
            timeouts.push(timeout2);
          }, time);
          timeouts.push(timeout1);
        }
      });
    });

    // Store sources and timeouts for stopping
    setActiveAudioSources({ sources, timeouts });
  };

  // Play all tracks simultaneously with mute/solo logic and volume
  const playAllTracks = () => {
    if (!audioContextRef.current || recordedTracks.length === 0) return;
    setIsPlaying(true);
    const audioContext = audioContextRef.current;

    const sources = []; // Collect all audio sources
    const timeouts = []; // Collect all timeouts

    const anySolo = trackSettings.some(t => t.solo);
    
    recordedTracks.forEach((track, trackIndex) => {
      const settings = trackSettings[trackIndex];
      
      // Skip muted tracks or non-soloed tracks when solo is active
      if (settings?.muted || (anySolo && !settings?.solo)) return;
      
      const trackVolume = settings?.volume ?? 1;
      const finalGain = masterVolume * trackVolume;
      
      track.forEach(({ key, time, isImported, audioBuffer }) => {
        if (isImported && audioBuffer) {
          // Play imported audio
          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;
          const gainNode = audioContext.createGain();
          gainNode.gain.value = finalGain;
          source.connect(gainNode).connect(audioContext.destination);
          source.start(audioContext.currentTime + time / 1000);
          sources.push(source);
        } else if (!sounds[key]) {
          return;
        } else {
          const animal = animalKeyMap[key];
          const source = audioContext.createBufferSource();
          source.buffer = sounds[key];

          const gainNode = audioContext.createGain();
          gainNode.gain.value = finalGain;

          source.connect(gainNode).connect(audioContext.destination);
          source.start(audioContext.currentTime + time / 1000);
          sources.push(source);

          const timeout1 = setTimeout(() => {
            setPlayingAnimals(prev => ({ ...prev, [animal]: true }));
            const timeout2 = setTimeout(() => setPlayingAnimals(prev => ({ ...prev, [animal]: false })), 300);
            timeouts.push(timeout2);
          }, time);
          timeouts.push(timeout1);
        }
      });
    });

    // Store sources and timeouts for stopping
    setActiveAudioSources({ sources, timeouts });

    const longestTrack = Math.max(...recordedTracks.map(track => {
      if (track.length === 0) return 0;
      const lastNote = track[track.length - 1];
      if (lastNote.isImported && lastNote.audioBuffer) {
        return lastNote.time + (lastNote.audioBuffer.duration * 1000);
      }
      return lastNote.time;
    }));
    
    const endTimeout = setTimeout(() => {
      setIsPlaying(false);
      setActiveAudioSources([]);
    }, longestTrack + 400);
    timeouts.push(endTimeout);
  };

  // Stop playback
  const stopPlayback = () => {
    if (activeAudioSources.sources) {
      // Stop all audio sources
      activeAudioSources.sources.forEach(source => {
        try {
          source.stop();
        } catch (e) {
          // Source may have already stopped
        }
      });
      
      // Clear all timeouts
      activeAudioSources.timeouts.forEach(timeout => {
        clearTimeout(timeout);
      });
      
      setActiveAudioSources([]);
      setIsPlaying(false);
      setPlayingAnimals({});
    }
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

  const setTrackVolume = (index, volume) => {
    const newVolume = parseFloat(volume);
    setTrackSettings(prev => prev.map((t, i) =>
      i === index ? { ...t, volume: newVolume } : t
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

  // Import custom audio track
  const importAudioTrack = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "audio/*";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
        
        // Extract filename without extension
        const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        
        // Create a track entry representing the imported audio
        const importedTrack = [{ 
          key: `imported_${Date.now()}`, 
          time: 0,
          isImported: true,
          audioBuffer: audioBuffer,
          fileName: file.name
        }];

        setRecordedTracks(prev => [...prev, importedTrack]);
        setTrackSettings(prev => [
          ...prev,
          { name: fileNameWithoutExt, muted: false, solo: false, volume: 1 }
        ]);
        setTrackCounter(c => c + 1); // Increment counter for imported tracks too

        // Store the audio buffer separately for playback
        setImportedAudioBuffers(prev => [...prev, audioBuffer]);
        
        alert(`Imported: ${file.name}`);
      } catch (err) {
        console.error("Error importing audio:", err);
        alert("Failed to import audio file. Make sure it's a valid audio format.");
      }
    };
    input.click();
  };

  // Export combined tracks with individual track volumes
  const exportRecording = async () => {
    if (!audioContextRef.current || recordedTracks.length === 0) return;

    const fileName = prompt("Enter a name for your recording:", "animalband_recording");
    if (!fileName) return;

    // Calculate the total duration needed
    let maxDuration = 0;
    recordedTracks.forEach(track => {
      if (track.length === 0) return;
      const lastNote = track[track.length - 1];
      if (lastNote.isImported && lastNote.audioBuffer) {
        const trackEnd = lastNote.time + (lastNote.audioBuffer.duration * 1000);
        maxDuration = Math.max(maxDuration, trackEnd);
      } else {
        maxDuration = Math.max(maxDuration, lastNote.time + 1000);
      }
    });

    const duration = maxDuration / 1000;
    const offlineCtx = new OfflineAudioContext(2, 44100 * duration, 44100);

    // Render all tracks with individual volumes
    recordedTracks.forEach((track, trackIndex) => {
      const trackVolume = trackSettings[trackIndex]?.volume ?? 1;
      track.forEach(({ key, time, isImported, audioBuffer }) => {
        if (isImported && audioBuffer) {
          // Render imported audio
          const source = offlineCtx.createBufferSource();
          source.buffer = audioBuffer;
          const gainNode = offlineCtx.createGain();
          gainNode.gain.value = masterVolume * trackVolume;
          source.connect(gainNode).connect(offlineCtx.destination);
          source.start(time / 1000);
        } else {
          // Render keyboard sounds
          const buffer = sounds[key];
          if (!buffer) return;
          const source = offlineCtx.createBufferSource();
          source.buffer = buffer;
          const gainNode = offlineCtx.createGain();
          gainNode.gain.value = masterVolume * trackVolume;
          source.connect(gainNode).connect(offlineCtx.destination);
          source.start(time / 1000);
        }
      });
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
              style={{ width: "75px", height: "75px", borderRadius: "50%", cursor: "pointer", objectFit: "cover" }}
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
          <label style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px", fontWeight: "600" }}>
            <span>Master Volume</span>
            <span>{(masterVolume * 100).toFixed(0)}%</span>
          </label>
          <style>
            {`
              input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #4CAF50;
                cursor: pointer;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              }
              input[type="range"]::-moz-range-thumb {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #4CAF50;
                cursor: pointer;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              }
            `}
          </style>
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
            style={{
              width: "100%",
              height: "8px",
              borderRadius: "4px",
              outline: "none",
              background: `linear-gradient(to right, #4CAF50 0%, #4CAF50 ${masterVolume * 100}%, #ddd ${masterVolume * 100}%, #ddd 100%)`,
              WebkitAppearance: "none",
              appearance: "none"
            }}
          />
        </div>

        <div className="record-controls">
          <button
            onClick={toggleRecording}
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "10px",
              fontSize: "16px",
              fontWeight: "600",
              border: "2px solid #333",
              borderRadius: "8px",
              backgroundColor: isRecording ? "#ff4444" : "white",
              color: isRecording ? "white" : "#333",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            <span style={{ fontSize: "20px" }}>{isRecording ? "■" : "●"}</span>
            {isRecording ? "Stop Recording" : "Start Recording"}
          </button>

          <button
            onClick={isPlaying ? stopPlayback : playAllTracks}
            disabled={isRecording || recordedTracks.length === 0}
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "10px",
              fontSize: "16px",
              fontWeight: "600",
              border: "2px solid #333",
              borderRadius: "8px",
              backgroundColor: "white",
              color: "#333",
              cursor: isRecording || recordedTracks.length === 0 ? "not-allowed" : "pointer",
              opacity: isRecording || recordedTracks.length === 0 ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            <span style={{ fontSize: "20px" }}>{isPlaying ? "■" : "►"}</span>
            {isPlaying ? "Stop" : "Play Recording"}
          </button>

          <button
            onClick={exportRecording}
            disabled={recordedTracks.length === 0}
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "10px",
              fontSize: "16px",
              fontWeight: "600",
              border: "none",
              borderRadius: "8px",
              backgroundColor: recordedTracks.length === 0 ? "#ccc" : "#4CAF50",
              color: "white",
              cursor: recordedTracks.length === 0 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            <span className="material-symbols-outlined">file_download</span>
            Export
          </button>

          <button
            onClick={importAudioTrack}
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "16px",
              fontWeight: "600",
              border: "2px solid #333",
              borderRadius: "8px",
              backgroundColor: "white",
              color: "#333",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            <span className="material-symbols-outlined">upload</span>
            Import
          </button>
        </div>

        {/* Track list */}
        <div className="tracks-list" style={{ marginTop: "20px", padding: "15px", backgroundColor: "#f9f9f9", borderRadius: "8px" }}>
          <h3 style={{ marginBottom: "15px", fontSize: "18px", fontWeight: "700" }}>Recorded Tracks</h3>
          {recordedTracks.length === 0 && <p style={{ textAlign: "center", color: "#666" }}>No tracks yet.</p>}
          {recordedTracks.map((track, index) => (
            <div key={index} style={{
              backgroundColor: "white",
              padding: "12px",
              marginBottom: "10px",
              borderRadius: "8px",
              border: "1px solid #ddd"
            }}>
              {/* Track name and volume */}
              <div style={{ marginBottom: "10px" }}>
                {editingTrack === index ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => finishRename(index)}
                    onKeyDown={(e) => e.key === "Enter" && finishRename(index)}
                    autoFocus
                    style={{
                      width: "100%",
                      padding: "6px",
                      fontSize: "14px",
                      fontWeight: "600",
                      border: "2px solid #4CAF50",
                      borderRadius: "4px",
                      outline: "none"
                    }}
                  />
                ) : (
                  <div 
                    onDoubleClick={() => startRename(index)} 
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      marginBottom: "8px",
                      wordBreak: "break-word",
                      cursor: "pointer"
                    }}
                  >
                    {trackSettings[index]?.name || `Track ${index + 1}`}
                  </div>
                )}
                
                {/* Volume slider */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={trackSettings[index]?.volume ?? 1}
                    onChange={(e) => setTrackVolume(index, e.target.value)}
                    style={{
                      flexGrow: 1,
                      height: "6px",
                      borderRadius: "3px",
                      outline: "none",
                      background: `linear-gradient(to right, #4CAF50 0%, #4CAF50 ${(trackSettings[index]?.volume ?? 1) * 100}%, #ddd ${(trackSettings[index]?.volume ?? 1) * 100}%, #ddd 100%)`,
                      WebkitAppearance: "none",
                      appearance: "none"
                    }}
                  />
                  <span style={{ fontSize: "12px", fontWeight: "600", minWidth: "40px", textAlign: "right" }}>
                    {Math.round((trackSettings[index]?.volume ?? 1) * 100)}%
                  </span>
                </div>
              </div>
              
              {/* Track buttons */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px"
              }}>
                <button 
                  onClick={() => toggleMute(index)} 
                  style={{
                    padding: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                    border: "none",
                    borderRadius: "6px",
                    backgroundColor: trackSettings[index]?.muted ? "#ff6b6b" : "#e0e0e0",
                    color: trackSettings[index]?.muted ? "white" : "#333",
                    cursor: "pointer"
                  }}
                >
                  {trackSettings[index]?.muted ? "Unmute" : "Mute"}
                </button>
                <button 
                  onClick={() => toggleSolo(index)} 
                  style={{
                    padding: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                    border: "none",
                    borderRadius: "6px",
                    backgroundColor: trackSettings[index]?.solo ? "#4CAF50" : "#e0e0e0",
                    color: trackSettings[index]?.solo ? "white" : "#333",
                    cursor: "pointer"
                  }}
                >
                  {trackSettings[index]?.solo ? "Unsolo" : "Solo"}
                </button>
                <button 
                  onClick={() => startRename(index)} 
                  style={{
                    padding: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                    border: "none",
                    borderRadius: "6px",
                    backgroundColor: "#e0e0e0",
                    color: "#333",
                    cursor: "pointer"
                  }}
                >
                  Rename
                </button>
                <button 
                  onClick={() => deleteTrack(index)} 
                  style={{
                    padding: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                    border: "none",
                    borderRadius: "6px",
                    backgroundColor: "#ff6b6b",
                    color: "white",
                    cursor: "pointer"
                  }}
                >
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