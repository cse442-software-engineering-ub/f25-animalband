import React, { useState, useEffect } from "react";
import "./recordings.css";

export default function MyRecordings() {
  const [recordings, setRecordings] = useState([]);
  const [selectedRecording, setSelectedRecording] = useState(null);

  useEffect(() => {
    // Replace with actual API call to your backend
    const fetchRecordings = async () => {
      try {
        const response = await fetch(
          "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/saveRecordingsIsabel/php/getLocalRecordings.php",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              auth_token: "user-auth-token", // replace this with actual token from your app's context or cookies
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
              audioUrl: rec.recording, // Assuming 'recording' contains the audio file URL
            }));
            setRecordings(formattedRecordings);
          } else {
            console.error("Failed to fetch recordings:", data.error);
          }
        } else {
          console.error("Failed to fetch recordings:", response.statusText);
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
