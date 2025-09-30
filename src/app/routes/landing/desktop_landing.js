import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import "./desktop_landing.css";
import Ostrich from "../../../assets/ostrich.jpeg";
import Bird from "../../../assets/bird.jpeg";
import Hamster from "../../../assets/hamster.jpeg";
import Kangaroo from "../../../assets/kangaroo.jpeg";
import Snake from "../../../assets/snake.jpeg";



export default function Landing() {
  const navigate = useNavigate();
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
            <button className="btn-login" onClick={() => handleNavigation("/login")}>Login</button>
          <button className="btn-register" onClick={() => handleNavigation("/register")}>Register</button>
        </div>
      </header>

      {/* Website Description */}
      <section className="main-description">
        <h2 className="main-heading">Create Music with Animals</h2>
        <p className="subtitle">
          Play music with your animal bandmates on a stage. Layer beats,
          record music, and share it all with a friendly community.
        </p>
      </section>

      {/* Animal Stage */}
      <section className="band-stage">
        {/* Animal Images */}
        <div className="animals-container">  
          <div className="animal-member">
            <div className="hamster">
              <img src={Hamster} alt="Hamster"/>
            </div>
          </div>
          <div className="animal-member">
            <div className="snake">
              <img src={Snake} alt="Snake"/>
            </div>
          </div>
          <div className="animal-member">
            <div className="bird">
              <img src={Bird} alt="Bird"/>
            </div>
          </div>
          <div className="animal-member">
            <div className="kangaroo">
              <img src={Kangaroo} alt="Kangaroo"/>
            </div>
          </div>
          <div className="animal-member">
            <div className="ostrich">
              <img src={Ostrich} alt="Ostrich"/>
            </div>
          </div>
        </div>
        {/* Button */}
        <button className="btn-start-band">Start Your Band</button>
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
            <span className="material-symbols-outlined feature-icon">instant_mix</span>
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
      
      {/* Stats */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stat-card">
            <p className="stat-number">12,572</p>
            <p className="stat-label">Loops Created</p>
          </div>
          <div className="stat-card">
            <p className="stat-number">472</p>
            <p className="stat-label">Members</p>
          </div>
          <div className="stat-card">
            <p className="stat-number">2,184</p>
            <p className="stat-label">Posts</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <h3>Register for free and rock out with your animals today!</h3>
      </footer>

      
      {/* Material Icons Font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
        rel="stylesheet"
      />

    </div>
  );
}