import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./mobile_landing.css";
import Ostrich from "../../../assets/ostrich.jpeg";
import Bird from "../../../assets/bird.jpeg";
import Hamster from "../../../assets/hamster.jpeg";
import Kangaroo from "../../../assets/kangaroo.jpeg";
import Snake from "../../../assets/snake.jpeg";

export default function MobileLanding() {

  // Stuff for carousel
  const slides = [Ostrich, Bird, Hamster, Kangaroo, Snake];
  const trackRef = useRef(null);
  const [active, setActive] = useState(0);

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

  // Page
  return (
    <div className="m-landing">
      {/* Header */}
      <header className="m-header">
        <div className="m-site-title">
          <span className="material-symbols-outlined m-paw" aria-hidden>pets</span>
          <span className="m-name">ANIMALBAND</span>
        </div>
        {/* Auth */}
        <div className="m-auth">
          <Link to="/login" className="m-btn m-btn-solid">Login</Link>
          <Link to="/register" className="m-btn m-btn-outline">Register</Link>
        </div>
      </header>

      {/* Main */}
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

          {/* Dots */}
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
          {/* Stage */}
          <Link to="/stage" className="m-card">
            <span className="material-symbols-outlined m-card-icon">piano</span>
            <div className="m-card-text">
              <div className="m-card-title">Stage</div>
              <div className="m-card-sub">Play instruments with your favorite animals.</div>
            </div>
          </Link>
          {/* Looping */}
          <Link to="/looping" className="m-card">
            <span className="material-symbols-outlined m-card-icon">instant_mix</span>
            <div className="m-card-text">
              <div className="m-card-title">Looping</div>
              <div className="m-card-sub">Layer beats & notes with a visual mixer.</div>
            </div>
          </Link>
          {/* Forum */}
          <Link to="/forum" className="m-card">
            <span className="material-symbols-outlined m-card-icon">chat</span>
            <div className="m-card-text">
              <div className="m-card-title">Forum</div>
              <div className="m-card-sub">Share your tracks, ask for help, and get feedback.</div>
            </div>
          </Link>
          {/* Customization */}
          <Link to="/stage" className="m-card">
            <span className="material-symbols-outlined m-card-icon">edit</span>
            <div className="m-card-text">
              <div className="m-card-title">Customization</div>
              <div className="m-card-sub">Import sounds and personalize your animals.</div>
            </div>
          </Link>
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

      {/* Footer */}
      <footer className="m-footer">
        Register for free and rock out with your animals today!
      </footer>

      {/* Material Icons Font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
        rel="stylesheet"
      />
    </div>
  );
}