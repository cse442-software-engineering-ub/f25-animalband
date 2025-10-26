import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./desktop_landing.css";

import Ostrich from "../../../assets/ostrich.jpeg";
import Bird from "../../../assets/bird.jpeg";
import Hamster from "../../../assets/hamster.jpeg";
import Kangaroo from "../../../assets/kangaroo.jpeg";
import Snake from "../../../assets/snake.jpeg";

export default function Landing() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [memberCount, setMemberCount] = useState(null);
  const [postCount, setPostCount] = useState(null);
  const [loopCount, setLoopCount] = useState(null);

  // Track which song is playing (-1 = none)
  const [playingSong, setPlayingSong] = useState(-1);

  const togglePlay = (index) => {
    setPlayingSong((prev) => (prev === index ? -1 : index));
  };

  // Fetch user info
  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await fetch(
          "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php/getUser.php",
          { credentials: "include" }
        );
        const data = await res.json();
        if (data.loggedIn) {
          setUser(data);
        }
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    };
    checkUser();
  }, []);

  // Fetch member count
  useEffect(() => {
    const fetchMemberCount = async () => {
      try {
        const res = await fetch(
          "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php/getMemberCount.php"
        );
        const data = await res.json();
        if (data.memberCount !== undefined) {
          setMemberCount(data.memberCount);
        }
      } catch (err) {
        console.error("Failed to fetch member count", err);
      }
    };
    fetchMemberCount();
  }, []);

  // Fetch post count
  useEffect(() => {
    const fetchPostCount = async () => {
      try {
        const res = await fetch(
          "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php/getPostCount.php"
        );
        const data = await res.json();
        if (data.postCount !== undefined) {
          setPostCount(data.postCount);
        }
      } catch (err) {
        console.error("Failed to fetch post count", err);
      }
    };
    fetchPostCount();
  }, []);

  // Fetch loop count
  useEffect(() => {
    const fetchLoopCount = async () => {
      try {
        const res = await fetch(
          "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php/getLoopCount.php"
        );
        const data = await res.json();
        if (data.loopCount !== undefined) {
          setLoopCount(data.loopCount);
        }
      } catch (err) {
        console.error("Failed to fetch loop count", err);
      }
    };
    fetchLoopCount();
  }, []);

  const handleAccountClick = () => {
    if (user) {
      navigate("/account");
    } else {
      navigate("/login");
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
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

      {/* Website Description */}
      <section className="main-description">
        <h2 className="main-heading">Create Music with Animals</h2>
        <p className="subtitle">
          Play music with your animal bandmates on a stage. Layer beats, record
          music, and share it all with a friendly community.
        </p>
      </section>

      {/* Animal Stage */}
      <section className="band-stage">
        <div className="animals-container">
          <div className="animal-member">
            <div className="hamster">
              <img src={Hamster} alt="Hamster" />
            </div>
          </div>
          <div className="animal-member">
            <div className="snake">
              <img src={Snake} alt="Snake" />
            </div>
          </div>
          <div className="animal-member">
            <div className="bird">
              <img src={Bird} alt="Bird" />
            </div>
          </div>
          <div className="animal-member">
            <div className="kangaroo">
              <img src={Kangaroo} alt="Kangaroo" />
            </div>
          </div>
          <div className="animal-member">
            <div className="ostrich">
              <img src={Ostrich} alt="Ostrich" />
            </div>
          </div>
        </div>
        <Link to="/stage" className="btn-start-band">
          Start Your Band
        </Link>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="features-grid">
          {/* Stage */}
          <Link to="/stage" className="feature-card">
            <span className="material-symbols-outlined feature-icon">piano</span>
            <h3>Stage</h3>
            <p>Play instruments with your favorite animals.</p>
          </Link>
          {/* Looping */}
          <Link to="/looping" className="feature-card">
            <span className="material-symbols-outlined feature-icon">
              instant_mix
            </span>
            <h3>Looping</h3>
            <p>Layer beats & notes with a visual mixer.</p>
          </Link>
          {/* Forum */}
          <Link to="/forum" className="feature-card">
            <span className="material-symbols-outlined feature-icon">chat</span>
            <h3>Forum</h3>
            <p>Share your tracks, ask for help, and get feedback.</p>
          </Link>
          {/* Customization */}
          <Link to="/stage" className="feature-card">
            <span className="material-symbols-outlined feature-icon">edit</span>
            <h3>Customization</h3>
            <p>Import sounds and personalize your animals.</p>
          </Link>
        </div>
      </section>

      {/* Featured Songs */}
      <section className="featured-songs-section">
        <h2 className="featured-songs-title">Today's Top Songs</h2>
        <div className="featured-songs-grid">
          {[1, 2, 3].map((_, index) => (
            <div className="song-card" key={index}>
              <h3 className="song-title">Song Title {index + 1}</h3>
              <p className="song-author">by Artist {index + 1}</p>
              <button
                className="song-play-btn"
                onClick={() => togglePlay(index)}
              >
                <span className="material-symbols-outlined">
                  {playingSong === index ? "pause" : "play_arrow"}
                </span>
              </button>
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

      {/* Material Icons */}
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
        rel="stylesheet"
      />
    </div>
  );
}




