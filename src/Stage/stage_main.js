// Stage.js
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SOUND_CONFIG } from "./stage_soundsConfig";
import { loadSound, playSound, getAudioCtx } from "./stage_audioUtil";
import SoundControl from "./stage_soundControl";

export default function Stage() {
  const [sounds, setSounds] = useState({});
  const [volumes, setVolumes] = useState({});

  // Load all sounds on mount
  useEffect(() => {
    const loadAllSounds = async () => {
      try {
        const loadedSounds = {};
        const initialVolumes = {};
        for (const sound of SOUND_CONFIG) {
          loadedSounds[sound.key] = await loadSound(sound.file);
          initialVolumes[sound.key] = 1; // default volume 100%
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

  // Update volume for a sound
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

      <button style={{ marginTop: "1rem" }} onClick={() => getAudioCtx().resume()}>
        Enable Audio
      </button>

      <Link
        to="/"
        style={{ color: "blue", textDecoration: "underline", display: "block", marginTop: "1rem" }}
      >
        ← Back to Home
      </Link>
    </div>
  );
}
