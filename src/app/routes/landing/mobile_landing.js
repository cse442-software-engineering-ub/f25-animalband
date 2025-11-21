import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { preloadLandingSounds } from "./landing_player.js";
import MobileAddToPlaylistButton from "../../../components/mobile_add_to_playlist_button.js";

import RecordingPlaybackModal from "../account/recording_playback_modal.js";

import "./mobile_landing.css";
import Ostrich from "../../../assets/ostrich.jpeg";
import Bird from "../../../assets/bird.jpeg";
import Hamster from "../../../assets/hamster.jpeg";
import Kangaroo from "../../../assets/kangaroo.jpeg";
import Snake from "../../../assets/snake.jpeg";

export default function MobileLanding() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Carousel
  const slides = [Ostrich, Bird, Hamster, Kangaroo, Snake];
  const trackRef = useRef(null);
  const [active, setActive] = useState(0);

  // Songs
  const [featuredSongs, setFeaturedSongs] = useState([]);
  const [buffers, setBuffers] = useState(null); // for WAV download

  // 🔹 Shared playback modal state (same behavior as desktop landing)
  const [showRecModal, setShowRecModal] = useState(false);
  const [activeRecording, setActiveRecording] = useState(null); // {id,title,description}
  const [activeNotes, setActiveNotes] = useState([]);           // song.recording
  // const [buffers, setBuffers] = useState(null);
  const [playingIndex, setPlayingIndex] = useState(-1);
  const stopRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const b = await preloadLandingSounds();
        setBuffers(b);
      } catch (e) {
        console.error("Failed to preload sounds", e);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(
          "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php/getFeaturedSongs.php"
        );
        const d = await r.json();
        if (d?.success && Array.isArray(d.songs)) setFeaturedSongs(d.songs);
      } catch (e) {
        console.error("Failed to fetch featured songs", e);
      }
    })();
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await fetch(
          "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php/getUser.php",
          { credentials: "include" }
        );
        const data = await res.json();
        if (data.loggedIn) setUser(data);
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    };
    checkUser();
  }, []);

  const handleAccountClick = () => {
    if (user) navigate("/account");
    else navigate("/login");
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const stopAll = () => {
    if (stopRef.current) {
      stopRef.current();
      stopRef.current = null;
    }
  };



  // NEW: Handle remix button click
  const handleRemix = (song) => {
    // Stop any playing audio first
    stopAll();
    
    // Store the song data in sessionStorage so the stage can access it
    const remixData = {
      songId: song.id,
      title: song.title,
      author: song.author,
      description: song.description,
      recording: song.recording,
      isRemix: true
    };
    
    sessionStorage.setItem('remixData', JSON.stringify(remixData));
    
    // Navigate to stage with remix parameter
    navigate(`/stage?remix=${song.id}`);
  };

  useEffect(() => {
    return () => stopAll();
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollLeft / el.clientWidth);
      if (idx !== active) setActive(idx);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [active]);

  const goTo = (i) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  // 🔹 Normalize flat vs tracks-of-notes into a single note array
  const normalizeRecordingNotes = (rec) => {
    if (!Array.isArray(rec) || rec.length === 0) return [];
    const first = rec[0];

    // Flat: [{ key, time }, ...]
    if (first && typeof first === "object" && "key" in first && "time" in first) {
      return rec;
    }

    // Tracks: [ [ {key,time}, ... ], [ ... ], ... ]
    return rec
      .flat()
      .filter((n) => n && typeof n === "object" && "key" in n && "time" in n);
  };

  // 🔹 Open RecordingPlaybackModal for a song
  const openRecordingModal = (song) => {
    if (!song || !song.recording) return;
    const notes = normalizeRecordingNotes(song.recording);
    if (notes.length === 0) return;

    setActiveRecording({
      id: song.id,
      title: song.title || `Song #${song.id}`,
      description: song.description || "",
    });
    setActiveNotes(notes);
    setShowRecModal(true);
  };

  const closeRecordingModal = () => {
    setShowRecModal(false);
    setActiveRecording(null);
    setActiveNotes([]);
  };

  // 🔹 WAV download (same logic as desktop landing)
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
      for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
    };

    writeString(view, offset, "RIFF"); offset += 4;
    view.setUint32(offset, 36 + buffer.length * numOfChan * 2, true); offset += 4;
    writeString(view, offset, "WAVE"); offset += 4;
    writeString(view, offset, "fmt "); offset += 4;
    view.setUint32(offset, 16, true); offset += 4;
    view.setUint16(offset, 1, true); offset += 2;
    view.setUint16(offset, numOfChan, true); offset += 2;
    view.setUint32(offset, buffer.sampleRate, true); offset += 4;
    view.setUint32(offset, buffer.sampleRate * 2 * numOfChan, true); offset += 4;
    view.setUint16(offset, numOfChan * 2, true); offset += 2;
    view.setUint16(offset, 16, true); offset += 2;
    writeString(view, offset, "data"); offset += 4;
    view.setUint32(offset, buffer.length * numOfChan * 2, true); offset += 4;

    const inputL = buffer.getChannelData(0);
    const inputR = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : inputL;
    const interleaved = new Float32Array(buffer.length * 2);
    for (let i = 0, j = 0; i < buffer.length; i++, j += 2) {
      interleaved[j] = inputL[i];
      interleaved[j + 1] = inputR[i];
    }

    let index = 44;
    for (let i = 0; i < interleaved.length; i++, index += 2) {
      const sample = Math.max(-1, Math.min(1, interleaved[i]));
      view.setInt16(index, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    }

    return new Blob([view], { type: "audio/wav" });
  };

  return (
    <div className="m-landing">
      <header className={`m-header ${user ? "is-logged-in" : ""}`}>
        <div className="m-site-title">
          <span className="material-symbols-outlined m-paw" aria-hidden>
            pets
          </span>
          <span className="m-name">ANIMALBAND</span>
        </div>
        <div className={`m-auth ${user ? "is-logged-in" : ""}`}>
          {!user ? (
            <>
              <button
                className="m-btn m-btn-solid"
                onClick={() => navigate("/login")}
              >
                Login
              </button>
              <button
                className="m-btn m-btn-outline"
                onClick={() => navigate("/register")}
              >
                Register
              </button>
            </>
          ) : (
            <img
              src={`https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php/${user.profilePic}`}
              alt="Profile"
              className="m-profile-pic"
              onClick={handleAccountClick}
            />
          )}
        </div>
      </header>

      <main className="m-main">
        <h1 className="m-title">Create Music with Animals</h1>
        <p className="m-sub">
          Play music with your animal bandmates on a stage. Layer beats, record
          music, and share it all with a friendly community.
        </p>

        {/* Swipeable Animal Carousel */}
        <div className="m-carousel">
          <div
            className="m-track"
            ref={trackRef}
            role="region"
            aria-label="Feature images"
          >
            {slides.map((src, i) => (
              <div
                className="m-slide"
                key={i}
                aria-roledescription="slide"
                aria-label={`Image ${i + 1} of ${slides.length}`}
              >
                <img src={src} alt="" className="m-slide-img" />
              </div>
            ))}
          </div>

          <div className="m-dots" role="tablist" aria-label="Select image">
            {slides.map((_, i) => (
              <button
                key={i}
                className={`m-dot-btn ${active === i ? "is-active" : ""}`}
                aria-label={`Go to image ${i + 1}`}
                aria-selected={active === i ? "true" : undefined}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        </div>

        {/* Start Button */}
        <Link to="/stage" className="m-btn-start-band">
          Start Your Band
        </Link>

        {/* Features */}
        <section className="m-features">
          <Link to="/stage" className="m-card">
            <span className="material-symbols-outlined m-card-icon">piano</span>
            <div className="m-card-text">
              <div className="m-card-title">Stage</div>
              <div className="m-card-sub">
                Play instruments with your favorite animals.
              </div>
            </div>
          </Link>
          <Link to="/rhythm-game" className="m-card">
            <span className="material-symbols-outlined m-card-icon">
              instant_mix
            </span>
            <div className="m-card-text">
              <div className="m-card-title">Rhythm Game</div>
              <div className="m-card-sub">
                Two-player competitive mode to test your rhythm.
              </div>
            </div>
          </Link>
          <Link to="/forum" className="m-card">
            <span className="material-symbols-outlined m-card-icon">chat</span>
            <div className="m-card-text">
              <div className="m-card-title">Forum</div>
              <div className="m-card-sub">
                Share your tracks, ask for help, and get feedback.
              </div>
            </div>
          </Link>
          <Link to="/stage" className="m-card">
            <span className="material-symbols-outlined m-card-icon">edit</span>
            <div className="m-card-text">
              <div className="m-card-title">Customization</div>
              <div className="m-card-sub">
                Import sounds and personalize your animals.
              </div>
            </div>
          </Link>
        </section>

        {/* Today's Top Songs */}
        <section className="m-top-songs">
          <h2 className="m-top-songs-title">Today's Top Songs</h2>

          <div className="m-top-songs-list">
            {featuredSongs.length === 0 &&
              [0, 1, 2].map((i) => (
                <div key={`sk-${i}`} className="m-song-card">
                  <div className="m-song-info">
                    <div className="m-song-title">Loading…</div>
                    <div className="m-song-author">&nbsp;</div>
                  </div>
                  <button className="m-play-btn" disabled>
                    <span className="material-symbols-outlined">
                      hourglass_top
                    </span>
                  </button>
                </div>
                <button className="m-play-btn" aria-label="Play song" disabled>
                  <span className="material-symbols-outlined">hourglass_top</span>
                </button>
              </div>
            ))}

            {featuredSongs.map((song) => (
              <div key={song.id} className="m-song-card">
                <div className="m-song-info">
                  <div className="m-song-title">
                    {song.title || `Untitled #${song.id}`}
                  </div>
                  <div className="m-song-author">by {song.author}</div>
                </div>

                {/* FIXED: Removed inline styles that were overriding CSS */}
                <div className="m-song-actions">
                  <button
                    className="m-play-btn"
                    aria-label="Play song"
                    onClick={() => openRecordingModal(song)}
                    disabled={!song.recording || !normalizeRecordingNotes(song.recording).length}
                    title="Play with animals"
                  >
                    <span className="material-symbols-outlined">play_arrow</span>
                  </button>

                  {/* Remix Button */}
                  <button
                    className="m-remix-btn"
                    onClick={() => handleRemix(song)}
                    aria-label="Remix this song"
                    title="Remix this song"
                  >
                    <span className="material-symbols-outlined">
                      edit_note
                    </span>
                  </button>

                  <MobileAddToPlaylistButton
                    songId={song.id}
                    compact
                    user={user}
                    onAdded={() => {
                      console.log("Added to playlist!");
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="m-stats">
          <div className="m-stat">
            <div className="m-stat-num">12,572</div>
            <div className="m-stat-label">Loops</div>
          </div>
          <div className="m-stat">
            <div className="m-stat-num">472</div>
            <div className="m-stat-label">Members</div>
          </div>
          <div className="m-stat">
            <div className="m-stat-num">2,184</div>
            <div className="m-stat-label">Posts</div>
          </div>
        </section>
      </main>

      <footer className="m-footer">
        Register for free and rock out with your animals today!
      </footer>

      {/* 🔹 Shared playback modal for mobile featured songs */}
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