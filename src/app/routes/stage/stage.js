// Stage.js
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SOUND_CONFIG } from "./stage_soundsConfig";
import { loadSound, playSound, getAudioCtx, setMasterVolume } from "./stage_audioUtil";
import SoundControl from "./stage_soundControl";

export default function Stage() {
  const [sounds, setSounds] = useState({});
  const [volumes, setVolumes] = useState({});
  const [masterVolume, setMasterVol] = useState(1);

  // Load all sounds on mount
  useEffect(() => {
    const loadAllSounds = async () => {
      try {
        const loadedSounds = {};
        const initialVolumes = {};
        for (const sound of SOUND_CONFIG) {
          loadedSounds[sound.key] = await loadSound(sound.file);
          initialVolumes[sound.key] = 1; // default per-sound volume
        }
        setSounds(loadedSounds);
        setVolumes(initialVolumes);
        console.log("[DEBUG] All sounds loaded!");
      } catch (e) {
        console.error("[ERROR] Loading failed:", e);
      }
    };
    loadAllSounds();
  }, []);

  // Handle key presses
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (sounds[key]) playSound(sounds[key], volumes[key]);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sounds, volumes]);

  // Load persisted master volume
  useEffect(() => {
    const savedVol = parseFloat(localStorage.getItem("masterVolume") || "1");
    setMasterVol(savedVol);
    setMasterVolume(savedVol);
  }, []);

  // Persist master volume changes
  useEffect(() => {
    localStorage.setItem("masterVolume", masterVolume);
  }, [masterVolume]);

  // Update per-sound volume
  const handleVolumeChange = (key, value) => {
    setVolumes((prev) => ({ ...prev, [key]: parseFloat(value) }));
  };

  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h1>Stage</h1>
      <p style={{ fontSize: "0.9rem", color: "#888" }}>
        Press Q, W, E, R to play piano chords.<br />
        Press keys A, S, D, F to play drum sounds.<br /> 
        Adjust volume below:
      </p>

      {/* Master Volume Slider */}
      <div style={{ marginTop: "1.5rem" }}>
        <label htmlFor="masterVolume" style={{ fontWeight: "bold" }}>
          Master Volume: {(masterVolume * 100).toFixed(0)}%
        </label>
        <input
          id="masterVolume"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={masterVolume}
          onChange={(e) => {
            const newVol = parseFloat(e.target.value);
            setMasterVol(newVol);      // update slider state
            setMasterVolume(newVol);   // update master gain node
          }}
          style={{ width: "300px", display: "block", margin: "0.5rem auto" }}
        />
      </div>

      {/* Individual Sound Controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "2rem",
          flexWrap: "wrap",
          marginTop: "1rem",
        }}
      >
        {SOUND_CONFIG.map((sound) => (
          <SoundControl
            key={sound.key}
            sound={sound}
            volume={volumes[sound.key] || 1}
            onVolumeChange={handleVolumeChange}
          />
        ))}
      </div>

      {/* Enable Audio Button */}
      <button style={{ marginTop: "1rem" }} onClick={() => getAudioCtx().resume()}>
        Enable Audio
      </button>

      {/* Back to Home Link */}
      <Link
        to="/"
        style={{ color: "blue", textDecoration: "underline", display: "block", marginTop: "1rem" }}
      >
        ← Back to Home
      </Link>
    </div>
  );
}
