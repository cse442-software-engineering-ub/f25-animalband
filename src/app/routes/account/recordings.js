import React, { useState, useEffect } from "react";
import "./recordings.css";

export default function MyRecordings() {
  const [recordings, setRecordings] = useState([]);
  const [selectedRecording, setSelectedRecording] = useState(null);

  useEffect(() => {
    // TODO: Replace this with actual API call to your backend
    setRecordings([
      {
        id: 1,
        title: "Meeting Notes",
        description: "Team discussion on Q4 goals.",
        audioUrl: "/example-audio-1.mp3",
      },
      {
        id: 2,
        title: "Idea Dump",
        description: "Brainstorming session with self.",
        audioUrl: "/example-audio-2.mp3",
      },
    ]);
  }, []);

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
    </div>
  );
}
