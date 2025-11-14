import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import DeleteAccountModal from "../../components/DeleteAccountModal";
import "./desktop_profile.css";

const PHP_BASE = "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php";

export default function DesktopProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [postCount, setPostCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [recordingCount, setRecordingCount] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${PHP_BASE}/getUser.php`, { credentials: "include" });
        const data = await res.json();
        if (data.loggedIn) setUser(data);
        else navigate("/login");
      } catch (err) {
        console.error("Failed to fetch user", err);
        navigate("/login");
      }
    };
    fetchUser();
  }, [navigate]);

  useEffect(() => {
    if (!user?.username || !user?.email) return;
    const fetchUserStats = async () => {
      try {
        const postRes = await fetch(`${PHP_BASE}/getUserPostCount.php?username=${encodeURIComponent(user.username)}`);
        const postData = await postRes.json();
        setPostCount(postData.count || 0);

        const likeRes = await fetch(`${PHP_BASE}/getUserLikeCount.php?username=${encodeURIComponent(user.username)}`);
        const likeData = await likeRes.json();
        setLikeCount(likeData.totalLikes || 0);

        const recRes = await fetch(`${PHP_BASE}/getUserRecordingCount.php?email=${encodeURIComponent(user.email)}`);
        const recData = await recRes.json();
        setRecordingCount(recData.count || 0);
      } catch (err) {
        console.error("Failed to fetch user's stats", err);
      }
    };
    fetchUserStats();
  }, [user]);

  const handleProfilePicClick = () => fileInputRef.current?.click();

  const handleProfilePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("profilePic", file);

    try {
      const res = await fetch(`${PHP_BASE}/updateProfilePic.php`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) setUser((prev) => ({ ...prev, profilePic: data.profilePic }));
      else alert("Failed to update profile picture.");
    } catch (err) {
      console.error("Error uploading new profile pic", err);
      alert("Error uploading new profile pic.");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${PHP_BASE}/logout.php`, { method: "POST", credentials: "include" });
      setUser(null);
      navigate("/");
    } catch (err) {
      console.error("Logout failed", err);
      alert("Failed to log out. Please try again.");
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`${PHP_BASE}/deleteAccount.php`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        window.location.href = "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/";
      } else {
        alert(data.message || "Failed to delete account.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting account.");
    }
  };

  return (
    <div className="profile-page">
      <header className="header">
        <Link to="/" className="logo-section">
          <span className="material-symbols-outlined paw-icon">pets</span>
          <h1 className="site-title">ANIMALBAND</h1>
        </Link>
        <div className="header-buttons">
          {user && (
            <img
              src={`${PHP_BASE}/${user.profilePic}`}
              alt="Profile"
              className="profile-pic"
              onClick={() => navigate("/account")}
            />
          )}
        </div>
      </header>

      <div className="profile-layout">
        <aside className="sidebar">
          <h3>Menu</h3>
          <ul>
          <li><button onClick={() => navigate("/")}>Home</button></li>
          <li><button onClick={() => navigate("/forum")}>Forum</button></li>
            <li><button onClick={() => navigate("/my-recordings")}>My Recordings</button></li>
            <li><button onClick={() => navigate("/playlists")}>My Playlists</button></li>
            <li><button onClick={() => navigate("/stage")}>Back to Stage</button></li>
            <li><button onClick={handleLogout}>Logout</button></li>
          </ul>
        </aside>

        <DeleteAccountModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onConfirm={async () => {
            try {
              await handleDelete();
            } catch (err) {
              throw err;
            }
          }}
        />

        <main className="profile-content">
          {user ? (
            <>
              <div className="profile-pic-container" onClick={handleProfilePicClick}>
                <img
                  src={`${PHP_BASE}/${user.profilePic}`}
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
                </div>
              </div>

              <div className="profile-stats">
                <h3>My Statistics</h3>
                <div className="stats-container">
                  <div className="stat-card">
                    <div className="stat-number">{postCount}</div>
                    <div className="stat-label">Posts</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{recordingCount}</div>
                    <div className="stat-label">Recordings</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{likeCount}</div>
                    <div className="stat-label">Likes</div>
                  </div>
                </div>
              </div>

              {/* New bottom action buttons */}
              <div className="profile-actions">
                <button
                  className="action-btn edit-btn"
                  onClick={() => navigate("/account/edit")}
                >
                  Edit Account
                </button>
                <button
                  className="action-btn delete-btn"
                  onClick={() => setModalOpen(true)}
                >
                  Delete Account
                </button>
              </div>
            </>
          ) : (
            <p>Loading profile...</p>
          )}
        </main>
      </div>

      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
        rel="stylesheet"
      />
    </div>
  );
}

