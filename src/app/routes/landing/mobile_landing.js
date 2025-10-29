import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { preloadLandingSounds, schedulePlayback } from "./landing_player.js";

import "./mobile_landing.css";
import Ostrich from "../../../assets/ostrich.jpeg";
import Bird from "../../../assets/bird.jpeg";
import Hamster from "../../../assets/hamster.jpeg";
import Kangaroo from "../../../assets/kangaroo.jpeg";
import Snake from "../../../assets/snake.jpeg";

export default function MobileLanding() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Stuff for carousel
  const slides = [Ostrich, Bird, Hamster, Kangaroo, Snake];
  const trackRef = useRef(null);
  const [active, setActive] = useState(0);

  // Songs
  const topSongs = [
    { title: "Animal Jam", author: "DJ Owl" },
    { title: "Paws and Beats", author: "Cat Band" },
    { title: "Roar Remix", author: "Lion Orchestra" },
  ];
  const [featuredSongs, setFeaturedSongs] = useState([]);
  const [buffers, setBuffers] = useState(null);
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
        const r = await fetch("https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php/getFeaturedSongs.php");
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

  const togglePlay = (index) => {
    if (!buffers) return;
    if (playingIndex === index) {
      stopAll();
      setPlayingIndex(-1);
      return;
    }
    stopAll();
    const song = featuredSongs[index];
    if (!song) return;
    stopRef.current = schedulePlayback(buffers, song.recording, () => {
      setPlayingIndex(-1);
      stopRef.current = null;
    });
    setPlayingIndex(index);
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

  return (
    <div className="m-landing">
      <header className={`m-header ${user ? "is-logged-in" : ""}`}>
        <div className="m-site-title">
          <span className="material-symbols-outlined m-paw" aria-hidden>pets</span>
          <span className="m-name">ANIMALBAND</span>
        </div>
        <div className={`m-auth ${user ? "is-logged-in" : ""}`}>
          {!user ? (
            <>
              <button className="m-btn m-btn-solid" onClick={() => navigate("/login")}>Login</button>
              <button className="m-btn m-btn-outline" onClick={() => navigate("/register")}>Register</button>
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
          Play music with your animal bandmates on a stage. Layer beats, record music,
          and share it all with a friendly community.
        </p>

        {/* Swipeable Animal Carousel */}
        <div className="m-carousel">
          <div className="m-track" ref={trackRef} role="region" aria-label="Feature images">
            {slides.map((src, i) => (
              <div className="m-slide" key={i} aria-roledescription="slide" aria-label={`Image ${i + 1} of ${slides.length}`}>
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
        <Link to="/stage" className="m-btn-start-band">Start Your Band</Link>

        {/* Features */}
        <section className="m-features">
          <Link to="/stage" className="m-card">
            <span className="material-symbols-outlined m-card-icon">piano</span>
            <div className="m-card-text">
              <div className="m-card-title">Stage</div>
              <div className="m-card-sub">Play instruments with your favorite animals.</div>
            </div>
          </Link>
          <Link to="/looping" className="m-card">
            <span className="material-symbols-outlined m-card-icon">instant_mix</span>
            <div className="m-card-text">
              <div className="m-card-title">Looping</div>
              <div className="m-card-sub">Layer beats & notes with a visual mixer.</div>
            </div>
          </Link>
          <Link to="/forum" className="m-card">
            <span className="material-symbols-outlined m-card-icon">chat</span>
            <div className="m-card-text">
              <div className="m-card-title">Forum</div>
              <div className="m-card-sub">Share your tracks, ask for help, and get feedback.</div>
            </div>
          </Link>
          <Link to="/stage" className="m-card">
            <span className="material-symbols-outlined m-card-icon">edit</span>
            <div className="m-card-text">
              <div className="m-card-title">Customization</div>
              <div className="m-card-sub">Import sounds and personalize your animals.</div>
            </div>
          </Link>
        </section>

        {/* Today's Top Songs */}
        <section className="m-top-songs">
          <h2 className="m-top-songs-title">Today's Top Songs</h2>

          <div className="m-top-songs-list">
            {featuredSongs.length === 0 && [0, 1, 2].map(i => (
              <div key={`sk-${i}`} className="m-song-card">
                <div className="m-song-info">
                  <div className="m-song-title">Loading…</div>
                  <div className="m-song-author">&nbsp;</div>
                </div>
                <button className="m-play-btn" disabled>
                  <span className="material-symbols-outlined">hourglass_top</span>
                </button>
              </div>
            ))}

            {featuredSongs.map((song, index) => (
              <div key={song.id} className="m-song-card">
                <div className="m-song-info">
                  <div className="m-song-title">{song.title || `Untitled #${song.id}`}</div>
                  <div className="m-song-author">by {song.author}</div>
                </div>

                <button
                  className="m-play-btn"
                  disabled={!buffers}
                  onClick={() => togglePlay(index)}
                  title={!buffers ? "Loading sounds..." : (playingIndex === index ? "Stop" : "Play")}
                >
                  <span className="material-symbols-outlined">
                    {playingIndex === index ? "stop" : "play_arrow"}
                  </span>
                </button>
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

      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
        rel="stylesheet"
      />
    </div>
  );
}
