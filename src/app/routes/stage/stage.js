import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SOUND_CONFIG } from "./stage_soundsConfig";
import { loadSound, playSound, setMasterVolume } from "./stage_audioUtil";
import "./stage.css";

import Ostrich from "../../../assets/ostrich.jpeg";
import Bird from "../../../assets/bird.jpeg";
import Hamster from "../../../assets/hamster.jpeg";
import Kangaroo from "../../../assets/kangaroo.jpeg";
import Snake from "../../../assets/snake.jpeg";

export default function Stage() {
  const navigate = useNavigate();
  const [sounds, setSounds] = useState({});
  const [volumes, setVolumes] = useState({});
  const [masterVolume, setMasterVol] = useState(1);

  // Load all sounds
  useEffect(() => {
    const loadAllSounds = async () => {
      try {
        const loadedSounds = {};
        const initialVolumes = {};
        for (const sound of SOUND_CONFIG) {
          loadedSounds[sound.key] = await loadSound(sound.file);
          initialVolumes[sound.key] = 1;
        }
        setSounds(loadedSounds);
        setVolumes(initialVolumes);
      } catch (e) {
        console.error("[ERROR] Loading failed:", e);
      }
    };
    loadAllSounds();
  }, []);

  // Keyboard play
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (sounds[key]) playSound(sounds[key], volumes[key]);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sounds, volumes]);

  // Master volume persistence
  useEffect(() => {
    const savedVol = parseFloat(localStorage.getItem("masterVolume") || "1");
    setMasterVol(savedVol);
    setMasterVolume(savedVol);
  }, []);

  useEffect(() => {
    localStorage.setItem("masterVolume", masterVolume);
  }, [masterVolume]);

  const handleVolumeChange = (key, value) => {
    setVolumes((prev) => ({ ...prev, [key]: parseFloat(value) }));
  };

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="header">
        <Link to="/" className="logo-section">
          <span className="material-symbols-outlined paw-icon">pets</span>
          <h1 className="site-title">ANIMALBAND</h1>
        </Link>

        <nav className="nav-links">
          <Link to="/stage" className="nav-item active">Stage</Link>
          <Link to="/looping" className="nav-item">Looping & Recording</Link>
          <Link to="/forum" className="nav-item">Forum</Link>
        </nav>

        <div className="header-buttons">
          <button className="btn-login" onClick={() => navigate("/login")}>Login</button>
          <button className="btn-register" onClick={() => navigate("/register")}>Register</button>
        </div>
      </header>

      {/* Stage Section */}
      <section className="band-stage">
        <h2 className="main-heading">Stage</h2>
        <p className="subtitle">
          Press your keyboard to play instruments. Adjust volumes below!
        </p>

        {/* Animals Horizontal */}
        <div className="animals-container">
          {/* Hamster */}
          <div className="animal-member">
            <img src={Hamster} alt="Hamster Drums"/>
            <div className="animal-controls">
              <p className="key-text">A S D F </p>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volumes["hamster"] || 1}
                onChange={(e) => handleVolumeChange("hamster", e.target.value)}
              />
            </div>
          </div>

          {/* Bird */}
          <div className="animal-member">
            <img src={Bird} alt="Bird Vocals"/>
            <div className="animal-controls">
              <p className="key-text">[Q]-[P]</p>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volumes["bird"] || 1}
                onChange={(e) => handleVolumeChange("bird", e.target.value)}
              />
            </div>
          </div>

          {/* Ostrich */}
          <div className="animal-member">
            <img src={Ostrich} alt="Ostrich Keys"/>
            <div className="animal-controls">
              <p className="key-text">[1]-[0]</p>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volumes["ostrich"] || 1}
                onChange={(e) => handleVolumeChange("ostrich", e.target.value)}
              />
            </div>
          </div>

          {/* Kangaroo */}
          <div className="animal-member">
            <img src={Kangaroo} alt="Kangaroo Bass"/>
            <div className="animal-controls">
              <p className="key-text">[A]-[:]</p>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volumes["kangaroo"] || 1}
                onChange={(e) => handleVolumeChange("kangaroo", e.target.value)}
              />
            </div>
          </div>

          {/* Snake */}
          <div className="animal-member">
            <img src={Snake} alt="Snake Guitar"/>
            <div className="animal-controls">
              <p className="key-text">[Z]-[?]</p>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volumes["snake"] || 1}
                onChange={(e) => handleVolumeChange("snake", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Master Volume */}
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
      </section>

      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
        rel="stylesheet"
      />
    </div>
  );
}
