import { Link } from "react-router-dom";
import "./landing.css"
import Ostrich from "../../../assets/ostrich.jpeg"
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
              <img src={Ostrich} alt="Ostrich"/>
            </div>
          </div>
          <div className="animal-member">
            <div className="iguana">
              <img src={Ostrich} alt="Ostrich"/>
            </div>
          </div>
          <div className="animal-member">
            <div className="bird">
              <img src={Ostrich} alt="Ostrich"/>
            </div>
          </div>
          <div className="animal-member">
            <div className="kangaroo">
              <img src={Ostrich} alt="Ostrich"/>
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



      
      {/* Material Icons Font */}
      <link
        href="https://fonts.googleapis.com/icon?family=Material+Icons"
        rel="stylesheet"
      />
    </div>
  );
}