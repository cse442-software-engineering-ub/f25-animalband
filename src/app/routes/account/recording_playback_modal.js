import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { SOUND_CONFIG } from "../stage/stage_soundsConfig";

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

// Props:
//   recording: { id, title, description }
//   recordedNotes: either flat array of {key,time} OR array of tracks-of-notes
//   onClose: () => void
export default function RecordingPlaybackModal({ recording, recordedNotes, onClose }) {
  const navigate = useNavigate();

  // --- Audio & animation state ---
  const [sounds, setSounds] = useState({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingAnimals, setPlayingAnimals] = useState({});
  const [imagesLoaded, setImagesLoaded] = useState(false);

  const audioContextRef = useRef(null);
  const activeSourcesRef = useRef([]);
  const masterVolume = 1;

  // Animal mappings + images (same as in recordings.js)
  const ANIMAL_IMAGES = {
    hamster: [Hamster, HamsterPlaying],
    bird: [Bird, BirdPlaying],
    ostrich: [Ostrich, OstrichPlaying],
    kangaroo: [Kangaroo, KangarooPlaying],
    snake: [Snake, SnakePlaying],
  };

  const animalKeyMap = {
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

  // Normalize recordedNotes so we can safely handle:
  //   - [ {key,time}, ... ]  (flat)
  //   - [ [ {key,time}, ... ], [ ... ], ... ] (tracks)
  const normalizedTracks = useMemo(() => {
    if (!Array.isArray(recordedNotes) || recordedNotes.length === 0) return [];
    const first = recordedNotes[0];
    // flat: first element is a note
    if (first && typeof first === "object" && "key" in first && "time" in first) {
      return [recordedNotes];
    }
    // already array-of-tracks
    return recordedNotes;
  }, [recordedNotes]);

  // --- Image preload (same logic as recordings.js) ---
  useEffect(() => {
    const allImages = Object.values(ANIMAL_IMAGES).flat();
    let loadedCount = 0;
    let cancelled = false;

    allImages.forEach((src) => {
      fetch(src)
        .then((res) => res.blob())
        .then((blob) => {
          if (cancelled) return;
          const img = new Image();
          img.onload = () => {
            loadedCount++;
            if (loadedCount === allImages.length && !cancelled) {
              setImagesLoaded(true);
            }
          };
          img.onerror = () => console.warn("Failed to preload:", src);
          img.src = URL.createObjectURL(blob);
        })
        .catch((err) => console.warn("Failed to fetch image:", src, err));
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // --- AudioContext + load sounds ---
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
    }

    const loadSoundForPage = async (filename) => {
      const audioContext = audioContextRef.current;
      const url = `${process.env.PUBLIC_URL}/stage_sounds/${filename}`;
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      return await audioContext.decodeAudioData(arrayBuffer);
    };

    const loadAllSounds = async () => {
      const loaded = {};
      for (const sound of SOUND_CONFIG) {
        try {
          loaded[sound.key] = await loadSoundForPage(sound.file);
        } catch (err) {
          console.warn(`Failed to load sound ${sound.file}:`, err);
        }
      }
      setSounds(loaded);
    };

    loadAllSounds();
  }, []);

  function stopAllSounds() {
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop(0);
      } catch {
        // ignore
      }
    });
    activeSourcesRef.current = [];
    setIsPlaying(false);
    setPlayingAnimals({});
  }

  // stop audio if component unmounts for any reason
  useEffect(() => {
    return () => {
      stopAllSounds();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playRecording = async () => {
    if (normalizedTracks.length === 0) return;
    const audioContext = audioContextRef.current;
    if (!audioContext) return;

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    setIsPlaying(true);
    let longestTime = 0;

    normalizedTracks.forEach((track) => {
      track.forEach(({ key, time }) => {
        const buffer = sounds[key];
        if (!buffer) {
          console.warn(`Sound for key ${key} not loaded`);
          return;
        }

        const source = audioContext.createBufferSource();
        source.buffer = buffer;

        const gainNode = audioContext.createGain();
        gainNode.gain.value = masterVolume;

        source.connect(gainNode).connect(audioContext.destination);
        source.start(audioContext.currentTime + time / 1000);

        activeSourcesRef.current.push(source);
        source.onended = () => {
          activeSourcesRef.current = activeSourcesRef.current.filter(
            (s) => s !== source
          );
        };

        const animal = animalKeyMap[key];
        if (animal) {
          setTimeout(() => {
            setPlayingAnimals((prev) => ({ ...prev, [animal]: true }));
            setTimeout(() => {
              setPlayingAnimals((prev) => ({ ...prev, [animal]: false }));
            }, 500);
          }, time);
        }

        if (time > longestTime) longestTime = time;
      });
    });

    setTimeout(() => {
      setIsPlaying(false);
      setPlayingAnimals({});
    }, longestTime + 500);
  };

  if (!recording) return null;

  return (
    <div
      className="modal-overlay recording-playback-overlay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,      // force above .m-post-overlay (1000)
      }}
      onClick={() => {
        stopAllSounds();
        onClose?.();
      }}
    >


      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "600px", position: "relative" }}
      >
        <h2>{recording.title}</h2>
        <p>{recording.description}</p>

        {/* Mini animal stage */}
        <div
          className="mini-stage"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "15px",
            margin: "20px 0",
            minHeight: "120px",
          }}
        >
          {Object.keys(ANIMAL_IMAGES)
            .filter((animal) =>
              normalizedTracks.some((track) =>
                track.some((note) => animalKeyMap[note.key] === animal)
              )
            )
            .map((animal) => (
              <img
                key={animal}
                src={
                  playingAnimals[animal]
                    ? ANIMAL_IMAGES[animal][1]
                    : ANIMAL_IMAGES[animal][0]
                }
                alt={animal}
                className={`mini-animal ${playingAnimals[animal] ? "playing" : ""}`}
                style={{
                  height: "80px",
                  width: "auto",
                  transition: "transform 0.3s ease",
                }}
              />
            ))}
        </div>

        <div
          className="buttons-row"
          style={{
            display: "flex",
            gap: "15px",
            justifyContent: "center",
            marginTop: "20px",
          }}
        >
          <button
            onClick={playRecording}
            disabled={!imagesLoaded || isPlaying}
            className="circle-btn play"
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              backgroundColor: isPlaying ? "#666" : "#15803d",
              color: "white",
              border: "none",
              cursor: isPlaying ? "not-allowed" : "pointer",
              fontSize: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Play Recording"
            aria-label="Play Recording"
          >
            {isPlaying ? "■" : "▶"}
          </button>
          <button
            className="circle-btn close"
            onClick={() => {
              stopAllSounds();
              onClose?.();
            }}
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              backgroundColor: "#9E9E9E",
              color: "white",
              border: "none",
              cursor: "pointer",
              fontSize: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Close"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
