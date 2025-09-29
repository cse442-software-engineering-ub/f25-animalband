import { Link } from "react-router-dom";
import "./landing.css"
export default function Landing() {
  return (
    <div className="landing-page">
      {/* Header */}
      <header className="header">
        <Link to="/" className="logo-section">
          <span className="material-icons paw-icon">pets</span>
          <h1 className="site-title">ANIMALBAND</h1>
        </Link>
        <div className="header-buttons">
          {/* TODO REGISTER LINKS */}
          <Link to="/todo">
            <button className="btn-login">Login</button>
          </Link>
          <Link to="/todo">
            <button className="btn-register">Register</button>
          </Link>
        </div>
      </header>
      {/* Website Description */}
      {/* Material Icons Font */}
      <link
        href="https://fonts.googleapis.com/icon?family=Material+Icons"
        rel="stylesheet"
      />
    </div>
  );
}