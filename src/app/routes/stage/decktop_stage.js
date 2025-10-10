import React, { useState, useEffect, useRef } from "react";
import { playSound, loadSound, setMasterVolume } from "./stage_audioUtil"; // Import from the relevant util file
import "./recordings.css";

export default function MyRecordings({ recordedNotes }) {
  const [recordings, setRecordings] = useState([]);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sounds, setSounds] = useState({});
  const [volumes, setVolumes] = useState({});
  const [masterVolume, setMasterVol] = useState(1);
  const audioContextRef = useRef(null);

  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
    }
  }, []);

  useEffect(() => {
    const loadAllSounds = async () => {
      const loadedSounds = {};
      const initialVolumes = {};
      const SOUND_CONFIG = [
        // Define sound config (same as in DesktopStage)
        { key: "a", file: "/sounds/hamster.wav" },
        { key: "s", file: "/sounds/hamster.wav" },
        // Add more sounds here...
      ];

      for (const sound of SOUND_CONFIG) {
        loadedSounds[sound.key] = await loadSound(sound.file);
        initialVolumes[sound.key] = 1;
      }

      setSounds(loadedSounds);
      setVolumes(initialVolumes);
    };

    loadAllSounds();
  }, []);

  const playRecording = () => {
    if (!recordedNotes.length || !audioContextRef.current) return;

    setIsPlaying(true);
    const audioContext = audioContextRef.current;

    const animalMap = {
      a: "hamster",
      s: "hamster",
      d: "hamster",
      f: "hamster",
      c: "bird",
      v: "bird",
      b: "bird",
      n: "bird",
      h: "ostrich",
      j: "ostrich",
      k: "ostrich",
      l: "ostrich",
      u: "kangaroo",
      i: "kangaroo",
      o: "kangaroo",
      p: "kangaroo",
      q: "snake",
      w: "snake",
      e: "snake",
      r: "snake",
    };

    recordedNotes.forEach(({ key, time }) => {
      const animal = animalMap[key];
      if (!animal || !sounds[key]) return;

      const volume = (volumes[animal] || 1) * masterVolume;

      const source = audioContext.createBufferSource();
      source.buffer = sounds[key];
      const gainNode = audioContext.createGain();
      gainNode.gain.value = volume;
      source.connect(gainNode).connect(audioContext.destination);
      source.start(audioContext.currentTime + time / 1000);

      setTimeout(() => {
        // Handle any UI feedback (e.g., animal playing animation)
      }, time);
    });

    const totalTime = recordedNotes[recordedNotes.length - 1].time + 400;
    setTimeout(() => setIsPlaying(false), totalTime);
  };

  const openModal = (recording) => {
    setSelectedRecording(recording);
  };

  const closeModal = () => {
    setSelectedRecording(null);
  };

  return (
    <div className="my-recordings-page">
      <h1>My Recordings</h1>
      <div className="recordings-grid">
        {recordings.map((rec) => (
          <div
            key={rec.id}
            className="recording-box"
            onClick={() => openModal(rec)}
          >
            <h3>{rec.title}</h3>
            <p>{rec.description}</p>
          </div>
        ))}
      </div>

      {selectedRecording && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{selectedRecording.title}</h2>
            <p>{selectedRecording.description}</p>
            <audio controls autoPlay src={selectedRecording.audioUrl}></audio>
            <button className="close-button" onClick={closeModal}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Playback Controls */}
      <div className="record-controls">
        <button
          onClick={playRecording}
          disabled={isPlaying || !recordedNotes.length}
          className={`record-btn play ${isPlaying ? "playing" : ""}`}
        >
          <span className="record-symbol">►</span>
          {isPlaying ? "Playing..." : "Play Recording"}
        </button>
      </div>
    </div>
  );
}