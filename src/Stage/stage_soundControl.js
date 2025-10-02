import React from "react";

export default function SoundControl({ sound, volume, onVolumeChange }) {
  return (
    <div style={{ textAlign: "center", marginBottom: "1rem" }}>
      <p>
        <strong>{sound.name}</strong> ({sound.key.toUpperCase()})
      </p>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={(e) => onVolumeChange(sound.key, e.target.value)}
      />
    </div>
  );
}
    