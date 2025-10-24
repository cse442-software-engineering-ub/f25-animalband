import React, { useState, useEffect, useRef } from "react";
import "./recordings.css";

// This would be similar to the DesktopStage's sounds and animal mapping
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

export default function MyRecordings() {
  const [recordings, setRecordings] = useState([]);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [sounds, setSounds] = useState({});
  const [volumes, setVolumes] = useState({});
  const audioContextRef = useRef(null);

  useEffect(() => {
    // Initialize AudioContext
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
    }
  }, []);

  useEffect(() => {
    // Fetch recordings
    const fetchRecordings = async () => {
      const cookies = document.cookie.split("; ");
      const cookieObj = Object.fromEntries(cookies.map((c) => c.split("=")));
      const authCookie = cookieObj["auth_token"] || "";
      try {
        const response = await fetch(
          "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/saveRecordingsIsabel/php/getLocalRecordings.php",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              auth_token: authCookie,
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.recordings) {
            const formattedRecordings = data.recordings.map((rec) => ({
              id: rec.id,
              title: rec.title,
              description: rec.description,
              audioUrl: rec.recording,
              // Assuming 'recording' contains the audio file URL
            }));
            setRecordings(formattedRecordings);
          }
        }
      } catch (error) {
        console.error("Error fetching recordings:", error);
      }
    };

    fetchRecordings();
  }, []);

  const openModal = (recording) => {
    setSelectedRecording(recording);
  };

  const closeModal = () => {
    setSelectedRecording(null);
  };

  // Play the selected recording using the AudioContext (similar to DesktopStage's playback logic)
  const playRecording = () => {
    if (!selectedRecording || !audioContextRef.current) return;

    const audioContext = audioContextRef.current;
    const { audioUrl } = selectedRecording;

    // Here we are assuming the audioUrl returns an ArrayBuffer that we can use directly
    // You might need to adjust this to load the audio data based on your backend response

    fetch(audioUrl)
      .then((response) => response.arrayBuffer())
      .then((data) => {
        audioContext.decodeAudioData(data, (buffer) => {
          const source = audioContext.createBufferSource();
          source.buffer = buffer;
          const gainNode = audioContext.createGain();
          source.connect(gainNode).connect(audioContext.destination);

          // Start playing the audio
          source.start(0);
        });
      })
      .catch((err) => console.error("Error playing recording:", err));
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
            {/* Play the recording using the custom play function */}
            <button onClick={playRecording} className="play-button">
              Play Recording
            </button>
            <button className="close-button" onClick={closeModal}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
