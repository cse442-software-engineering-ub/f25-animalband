import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { preloadLandingSounds } from "./landing_player.js";
import AddToPlaylistButton from "../../../components/desktop_add_to_playlist_button.js";
import CustomModal from "../../components/CustomModal.js";
import useCustomModal from "../../components/useCustomModal.js";
import "./desktop_landing.css";

import RecordingPlaybackModal from "../account/recording_playback_modal.js";

import Ostrich from "../../../assets/ostrich.png";
import Bird from "../../../assets/bird.png";
import Hamster from "../../../assets/hamster.png";
import Kangaroo from "../../../assets/kangaroo.png";
import Snake from "../../../assets/snake.png";

export default function Landing() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [memberCount, setMemberCount] = useState(null);
  const [postCount, setPostCount] = useState(null);
  const [loopCount, setLoopCount] = useState(null);

  const [featuredSongs, setFeaturedSongs] = useState([]);
  const [buffers, setBuffers] = useState(null);
  const [playingIndex, setPlayingIndex] = useState(-1);
  const stopRef = useRef(null);
  const { modalState, showModal, closeModal } = useCustomModal();

  const togglePlay = (idx) => {
    if (!buffers) return;
    if (playingIndex === idx) {
      stopAll();
      setPlayingIndex(-1);
      return;
    }
    stopAll();
    const song = featuredSongs[idx];
    if (!song) return;
    stopRef.current = schedulePlayback(buffers, song.recording, () => {
      setPlayingIndex(-1);
      stopRef.current = null;
    });
    setPlayingIndex(idx);
  };
  const [buffers, setBuffers] = useState(null); // still needed for WAV download

  // 🔹 State for playback modal (reuse same component as account/forum)
  const [showRecModal, setShowRecModal] = useState(false);
  const [activeRecording, setActiveRecording] = useState(null); // {id,title,description}
  const [activeNotes, setActiveNotes] = useState([]); // song.recording

  const handleAccountClick = () => {
    if (user) navigate("/account");
    else navigate("/login");
  };

  const handleNavigation = (path) => navigate(path);

  // NEW: Handle remix button click
  const handleRemix = (song) => {
    // Stop any playing audio first
    // stopAll();

    // Store the song data in sessionStorage so the stage can access it
    const remixData = {
      songId: song.id,
      title: song.title,
      author: song.author,
      description: song.description,
      recording: song.recording,
      isRemix: true,
    };

    sessionStorage.setItem("remixData", JSON.stringify(remixData));

    // Navigate to stage with remix parameter
    navigate(`/stage?remix=${song.id}`);
  };

  // Fetch user and counts
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(
          "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php/getUser.php",
          { credentials: "include" }
        );
        const data = await res.json();
        if (data.loggedIn) setUser(data);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchCount = async (url, setter) => {
      try {
        const res = await fetch(url);
        const data = await res.json();
        setter(data[Object.keys(data)[0]]);
      } catch (err) {
        console.error(err);
      }
    };

    fetchUser();
    fetchCount(
      "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php/getMemberCount.php",
      setMemberCount
    );
    fetchCount(
      "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php/getPostCount.php",
      setPostCount
    );
    fetchCount(
      "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php/getLoopCount.php",
      setLoopCount
    );
  }, []);

  // Preload sounds for WAV export
  useEffect(() => {
    (async () => {
      try {
        setBuffers(await preloadLandingSounds());
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  // Fetch featured songs
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(
          "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php/getFeaturedSongs.php"
        );
        const d = await r.json();
        if (d?.success && Array.isArray(d.songs)) setFeaturedSongs(d.songs);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  // 🔹 Open/close modal using same props as ForumPostModal/MyRecordings
  const openRecordingModal = (song) => {
    if (!song || !Array.isArray(song.recording) || song.recording.length === 0)
      return;

    setActiveRecording({
      id: song.id,
      title: song.title || `Song #${song.id}`,
      description: song.description || "",
    });
    setActiveNotes(song.recording); // this is what RecordingPlaybackModal expects as recordedNotes
    setShowRecModal(true);
  };

  const closeRecordingModal = () => {
    setShowRecModal(false);
    setActiveRecording(null);
    setActiveNotes([]);
  };

  // Helper: normalize flat vs tracks-of-notes into a single note array
  const normalizeRecordingNotes = (rec) => {
    if (!Array.isArray(rec) || rec.length === 0) return [];

    const first = rec[0];
    // Flat: [{ key, time }, ...]
    if (
      first &&
      typeof first === "object" &&
      "key" in first &&
      "time" in first
    ) {
      return rec;
    }
    // Tracks: [ [ {key,time}, ... ], [ ... ], ... ]
    return rec
      .flat()
      .filter((n) => n && typeof n === "object" && "key" in n && "time" in n);
  };

  // WAV download helper
  const downloadWav = async (song) => {
    if (!buffers || !song?.recording) return;

    const notes = normalizeRecordingNotes(song.recording);
    if (notes.length === 0) return;

    // Find latest note time
    const maxTimeMs = notes.reduce(
      (max, n) => (typeof n.time === "number" && n.time > max ? n.time : max),
      0
    );

    // +1000 ms tail; ensure at least 1 second
    const durationSec = Math.max(1, (maxTimeMs + 1000) / 1000);
    const sampleRate = 44100;
    const frameCount = Math.max(1, Math.floor(sampleRate * durationSec));

    const offlineCtx = new OfflineAudioContext(2, frameCount, sampleRate);

    // Schedule all notes
    notes.forEach(({ key, time }) => {
      const buffer = buffers[key];
      if (!buffer) return;

      const source = offlineCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(offlineCtx.destination);
      source.start(time / 1000);
    });

    const renderedBuffer = await offlineCtx.startRendering();
    const wavBlob = bufferToWav(renderedBuffer);

    const url = URL.createObjectURL(wavBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${song.title || `song_${song.id}`}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const bufferToWav = (buffer) => {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);

    let offset = 0;
    const writeString = (view, offset, string) => {
      for (let i = 0; i < string.length; i++)
        view.setUint8(offset + i, string.charCodeAt(i));
    };

    writeString(view, offset, "RIFF");
    offset += 4;
    view.setUint32(offset, 36 + buffer.length * numOfChan * 2, true);
    offset += 4;
    writeString(view, offset, "WAVE");
    offset += 4;
    writeString(view, offset, "fmt ");
    offset += 4;
    view.setUint32(offset, 16, true);
    offset += 4;
    view.setUint16(offset, 1, true);
    offset += 2;
    view.setUint16(offset, numOfChan, true);
    offset += 2;
    view.setUint32(offset, buffer.sampleRate, true);
    offset += 4;
    view.setUint32(offset, buffer.sampleRate * 2 * numOfChan, true);
    offset += 4;
    view.setUint16(offset, numOfChan * 2, true);
    offset += 2;
    view.setUint16(offset, 16, true);
    offset += 2;
    writeString(view, offset, "data");
    offset += 4;
    view.setUint32(offset, buffer.length * numOfChan * 2, true);
    offset += 4;

    const inputL = buffer.getChannelData(0);
    const inputR =
      buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : inputL;
    const interleaved = new Float32Array(buffer.length * 2);
    for (let i = 0, j = 0; i < buffer.length; i++, j += 2) {
      interleaved[j] = inputL[i];
      interleaved[j + 1] = inputR[i];
    }

    let index = 44;
    for (let i = 0; i < interleaved.length; i++, index += 2) {
      const sample = Math.max(-1, Math.min(1, interleaved[i]));
      view.setInt16(
        index,
        sample < 0 ? sample * 0x8000 : sample * 0x7fff,
        true
      );
    }

    return new Blob([view], { type: "audio/wav" });
  };

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="header">
        <Link to="/" className="logo-section">
          <span className="material-symbols-outlined paw-icon">pets</span>
          <h1 className="site-title">ANIMALBAND</h1>
        </Link>
        <div className="header-buttons">
          {!user ? (
            <>
              <button
                className="btn-login"
                onClick={() => handleNavigation("/login")}
              >
                Login
              </button>
              <button
                className="btn-register"
                onClick={() => handleNavigation("/register")}
              >
                Register
              </button>
            </>
          ) : (
            <img
              src={`https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php/${user.profilePic}`}
              alt="Profile"
              className="profile-pic"
              onClick={handleAccountClick}
              style={{
                width: "75px",
                height: "75px",
                borderRadius: "50%",
                cursor: "pointer",
                objectFit: "cover",
              }}
            />
          )}
        </div>
      </header>

      {/* Main description */}
      <section className="main-description">
        <h2 className="main-heading">Create Music with Animals</h2>
        <p className="subtitle">
          Play music with your animal bandmates on a stage. Layer beats, record
          music, and share it all with a friendly community.
        </p>
      </section>

      {/* Animal stage */}
      <section className="band-stage">
        <div className="animals-container">
          {[Hamster, Snake, Bird, Kangaroo, Ostrich].map((img, idx) => (
            <div key={idx} className="animal-member">
              <img src={img} alt="Animal" />
            </div>
          ))}
        </div>
        <Link to="/stage" className="btn-start-band">
          Start Your Band
        </Link>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="features-grid">
          <Link to="/stage" className="feature-card">
            <span className="material-symbols-outlined feature-icon">
              piano
            </span>
            <h3>Stage</h3>
            <p>Play instruments with your favorite animals.</p>
          </Link>

          <Link to="/rhythm-game" className="feature-card">
            <span className="material-symbols-outlined feature-icon">
              instant_mix
            </span>
            <h3>Rhythm Game</h3>
            <p>Test your musical gaming abilities!</p>
          </Link>

          <Link to="/forum" className="feature-card">
            <span className="material-symbols-outlined feature-icon">chat</span>
            <h3>Forum</h3>
            <p>Share your tracks, ask for help, and get feedback.</p>
          </Link>
        </div>
      </section>

      {/* Featured Songs */}
      <section className="featured-songs-section">
        <h2 className="featured-songs-title">Today's Top Songs</h2>
        <div className="featured-songs-grid">
          {featuredSongs.length === 0 &&
            [0, 1, 2].map((i) => (
              <div className="song-card" key={`sk-${i}`}>
                Loading…
              </div>
            ))}
          {featuredSongs.map((song) => (
            <div className="song-card" key={song.id}>
              <h3 className="song-title">
                {song.title || `Untitled #${song.id}`}
              </h3>
              <p className="song-author">by {song.author}</p>
              {song.description && (
                <p className="song-desc">{song.description}</p>
              )}
              <div className="song-button-group">
                {/* 🔹 Opens animal playback modal, same component as forum/account */}
                <button
                  className="song-play-btn"
                  aria-label="Play Song"
                  onClick={() => openRecordingModal(song)}
                >
                  <span className="material-symbols-outlined">play_arrow</span>
                </button>
                <button
                  className="song-download-btn"
                  aria-label="Download Song"
                  onClick={() => downloadWav(song)}
                >
                  <span className="material-symbols-outlined">download</span>
                </button>
                {/* NEW: Remix Button */}
                <button
                  className="song-remix-btn"
                  aria-label="Remix Song"
                  onClick={() => handleRemix(song)}
                  title="Remix this song"
                >
                  <span className="material-symbols-outlined">edit_note</span>
                </button>
                <AddToPlaylistButton
                  songId={song.id}
                  compact
                  onAdded={() => {
                    try { new AudioContext(); } catch (e) { }
                    showModal(`Added "${song.title || `song_${song.id}`}" to your playlist!`, "success");
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stat-card">
            <p className="stat-number">
              {loopCount !== null ? loopCount.toLocaleString() : "Loading..."}
            </p>
            <p className="stat-label">Loops Created</p>
          </div>
          <div className="stat-card">
            <p className="stat-number">
              {memberCount !== null
                ? memberCount.toLocaleString()
                : "Loading..."}
            </p>
            <p className="stat-label">Members</p>
          </div>
          <div className="stat-card">
            <p className="stat-number">
              {postCount !== null ? postCount.toLocaleString() : "Loading..."}
            </p>
            <p className="stat-label">Posts</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <h3>Register for free and rock out with your animals today!</h3>
      </footer>

      <CustomModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        message={modalState.message}
        type={modalState.type}
        title={modalState.title}
      />

      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
      {/* 🔹 Shared playback modal for Featured Songs */}
      {showRecModal && activeRecording && (
        <RecordingPlaybackModal
          recording={activeRecording}
          recordedNotes={activeNotes}
          onClose={closeRecordingModal}
        />
      )}

      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
        rel="stylesheet"
      />
    </div>
  );
}