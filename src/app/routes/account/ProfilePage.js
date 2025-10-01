import React from "react";
import { Link } from "react-router-dom";
import "./ProfilePage.css";

const ProfilePage = ({ handleNavigation, handleAccountClick }) => {
  return (
    <div className="profile-page">
      {/* Shared Header */}
      <header className="header">
        <Link to="/" className="logo-section">
          <span className="material-symbols-outlined paw-icon">pets</span>
          <h1 className="site-title">ANIMALBAND</h1>
        </Link>
        <div className="header-buttons">
          <button className="btn-login" onClick={() => handleNavigation("/login")}>
            Login
          </button>
          <button className="btn-register" onClick={() => handleNavigation("/register")}>
            Register
          </button>
          <button className="btn-account" onClick={() => handleAccountClick()}>
            Account
          </button>
        </div>
      </header>

      <div className="profile-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <ul>
            <li><button>My Recordings</button></li>
            <li><button>My Posts</button></li>
            <li><button>Edit Profile</button></li>
          </ul>
        </aside>

        {/* Main content */}
        <main className="profile-content">
          <div className="profile-header">
            <img
              src="https://via.placeholder.com/120"
              alt="Profile"
              className="profile-picture"
            />
            <h2 className="username">Username</h2>
          </div>

          <div className="profile-details">
            <p>Select a category from the sidebar to get started.</p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProfilePage;