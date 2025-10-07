import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import "./desktop_profile.css";

export default function DesktopProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(
          "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php/getUser.php",
          { credentials: "include" }
        );
        const data = await res.json();
        if (data.loggedIn) {
          setUser(data);
        } else {
          navigate("/login");
        }
      } catch (err) {
        console.error("Failed to fetch user", err);
        navigate("/login");
      }
    };
    fetchUser();
  }, [navigate]);

  const handleProfilePicClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleProfilePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profilePic", file);

    try {
      const res = await fetch(
        "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php/updateProfilePic.php",
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );
      const data = await res.json();
      if (data.success) {
        setUser((prev) => ({
          ...prev,
          profilePic: data.profilePic, // updated filepath
        }));
      } else {
        alert("Failed to update profile picture.");
      }
    } catch (err) {
      console.error("Error uploading new profile pic", err);
      alert("Error uploading new profile pic.");
    }
  };

  return (
    <div className="profile-page">
      {/* Header */}
      <header className="header">
        <Link to="/" className="logo-section">
          <span className="material-symbols-outlined paw-icon">pets</span>
          <h1 className="site-title">ANIMALBAND</h1>
        </Link>
        <div className="header-buttons">
          {user && (
            <img
              src={`https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php/${user.profilePic}`}
              alt="Profile"
              className="profile-pic"
              onClick={() => navigate("/account")}
            />
          )}
        </div>
      </header>

      {/* Body Layout */}
      <div className="profile-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <h3>Menu</h3>
          <ul>
            <li><button onClick={() => console.log("My Posts")}>My Posts</button></li>
            <li><button onClick={() => console.log("My Recordings")}>My Recordings</button></li>
            <li><button onClick={() => navigate("/account/edit")}>Edit Account</button></li>
            <li><button onClick={() => navigate("/stage")}>Back to Stage</button></li>
            <li><button onClick={() => {
              // ToDo: Add logout functionality here
              console.log("Logout");
              navigate("/login");
            }}>Logout</button></li>
          </ul>
        </aside>

        {/* Main Profile Section */}
        <main className="profile-content">
          {user ? (
            <>
              <div className="profile-pic-container" onClick={handleProfilePicClick}>
                <img
                  src={`https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php/${user.profilePic}`}
                  alt="Profile"
                  className="profile-pic-large"
                />
                <div className="profile-pic-overlay">Change Photo</div>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleProfilePicChange}
                />
              </div>
              <h2>{user.username}</h2>
              
              {/* Profile Information */}
              <div className="profile-info">
                <h3>Profile Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Username:</span>
                    <div className="info-value">{user.username}</div>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Email:</span>
                    <div className="info-value">{user.email || "Not provided"}</div>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Member Since:</span>
                    <div className="info-value">{user.joinDate || "Recently joined"}</div>
                  </div>
                </div>
              </div>

              {/* Profile Stats */}
              <div className="profile-stats">
                <h3>My Statistics</h3>
                <div className="stats-container">
                  <div className="stat-card">
                    <div className="stat-number">15</div>
                    <div className="stat-label">Posts</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">8</div>
                    <div className="stat-label">Recordings</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">127</div>
                    <div className="stat-label">Likes</div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p>Loading profile...</p>
          )}
        </main>
      </div>
      {/* Material Icons Font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
        rel="stylesheet"
      />
    </div>
  );
}