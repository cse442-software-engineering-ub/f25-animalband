import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import "./mobile_profile.css";

export default function MobileProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
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
          profilePic: data.profilePic,
        }));
      } else {
        alert("Failed to update profile picture.");
      }
    } catch (err) {
      console.error("Error uploading new profile pic", err);
      alert("Error uploading new profile pic.");
    }
  };

  const handleAccountClick = () => {
    if (user) {
      navigate("/account");
    } else {
      navigate("/login");
    }
  };

  // NEW: Handle edit profile button click
  const handleEditProfile = () => {
    navigate("/account/edit");
  };

  // Navigate to forum with specific view
  const navigateToForum = (view) => {
    navigate("/forum", { state: { activeView: view } });
    setShowMobileMenu(false);
  };

  return (
    <div className="mobile-profile-page">
      {/* Mobile Header */}
      <header className="mobile-header">
        <div className="mobile-header-left">
          <button
            className="mobile-menu-btn"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <Link to="/" className="mobile-logo">
            <span className="material-symbols-outlined paw-icon">pets</span>
            <span className="mobile-site-title">ANIMALBAND</span>
          </Link>
        </div>

        <div className="mobile-header-right">
          {user ? (
            <img
              src={`https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php/${user.profilePic}`}
              alt="Profile"
              className="mobile-profile-pic"
              onClick={handleAccountClick}
            />
          ) : (
            <button
              className="mobile-login-btn"
              onClick={() => navigate("/login")}
            >
              Login
            </button>
          )}
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {showMobileMenu && (
        <div className="mobile-nav-menu">
          <div className="mobile-nav-header">
            <h3>Menu</h3>
            <button
              className="mobile-close-btn"
              onClick={() => setShowMobileMenu(false)}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <nav className="mobile-nav">
            <button
              className="mobile-nav-btn"
              onClick={() => {
                navigate("/");
                setShowMobileMenu(false);
              }}
            >
              <span className="material-symbols-outlined">home</span>
              Home
            </button>
            <button
              className="mobile-nav-btn"
              onClick={() => navigateToForum("community")}
            >
              <span className="material-symbols-outlined">forum</span>
              Forum
            </button>
            <button
              className="mobile-nav-btn"
              onClick={() => navigateToForum("my-posts")}
            >
              <span className="material-symbols-outlined">article</span>
              My Posts
            </button>
            <button
              className="mobile-nav-btn"
              onClick={() => navigateToForum("my-likes")}
            >
              <span className="material-symbols-outlined">favorite</span>
              My Likes
            </button>
            <button
              className="mobile-nav-btn"
              onClick={() => {
                navigate("/my-recordings");
                setShowMobileMenu(false);
              }}
            >
              <span className="material-symbols-outlined">mic</span>
              My Recordings
            </button>
            <button
              className="mobile-nav-btn"
              onClick={() => {
                navigate("/playlists");
                setShowMobileMenu(false);
              }}
            >
              <span className="material-symbols-outlined">playlist_play</span>
              My Playlists
            </button>
            <button
              className="mobile-nav-btn active"
              onClick={() => {
                navigate("/account");
                setShowMobileMenu(false);
              }}
            >
              <span className="material-symbols-outlined">person</span>
              My Profile
            </button>
            {/* NEW: Edit Profile option in mobile menu */}
            <button
              className="mobile-nav-btn"
              onClick={() => {
                navigate("/account/edit");
                setShowMobileMenu(false);
              }}
            >
              <span className="material-symbols-outlined">edit</span>
              Edit Profile
            </button>
            <button
              className="mobile-nav-btn logout"
              onClick={() => {
                navigate("/login");
                setShowMobileMenu(false);
              }}
            >
              <span className="material-symbols-outlined">logout</span>
              Log Out
            </button>
          </nav>
        </div>
      )}

      {/* Main Profile Content */}
      <main className="mobile-profile-content">
        {user ? (
          <>
            <div
              className="mobile-profile-pic-container"
              onClick={handleProfilePicClick}
            >
              <img
                src={`https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php/${user.profilePic}`}
                alt="Profile"
                className="mobile-profile-pic-large"
              />
              <div className="mobile-profile-pic-overlay">Change Photo</div>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleProfilePicChange}
              />
            </div>
            <h2>{user.username}</h2>

            {/* NEW: Edit Profile Button */}
            <button
              className="mobile-edit-profile-btn"
              onClick={handleEditProfile}
            >
              <span className="material-symbols-outlined">edit</span>
              Edit Profile
            </button>

            {/* Profile Information */}
            <div className="mobile-profile-info">
              <h3>Profile Information</h3>
              <div className="mobile-info-grid">
                <div className="mobile-info-item">
                  <div className="mobile-info-label">Username</div>
                  <div className="mobile-info-value">{user.username}</div>
                </div>
                <div className="mobile-info-item">
                  <div className="mobile-info-label">Email</div>
                  <div className="mobile-info-value">
                    {user.email || "Not provided"}
                  </div>
                </div>
                <div className="mobile-info-item">
                  <div className="mobile-info-label">Member Since</div>
                  <div className="mobile-info-value">
                    {user.joinDate || "Recently joined"}
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Stats */}
            <div className="mobile-profile-stats">
              <h3>My Statistics</h3>
              <div className="mobile-stats-container">
                <div className="mobile-stat-card">
                  <div className="mobile-stat-number">15</div>
                  <div className="mobile-stat-label">Posts</div>
                </div>
                <div className="mobile-stat-card">
                  <div className="mobile-stat-number">8</div>
                  <div className="mobile-stat-label">Recordings</div>
                </div>
                <div className="mobile-stat-card">
                  <div className="mobile-stat-number">127</div>
                  <div className="mobile-stat-label">Likes</div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="mobile-loading">Loading profile...</div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        <Link to="/stage" className="mobile-nav-item">
          <span className="material-symbols-outlined mobile-nav-icon">
            piano
          </span>
          <span>Stage</span>
        </Link>
        <Link to="/looping" className="mobile-nav-item">
          <span className="material-symbols-outlined mobile-nav-icon">
            instant_mix
          </span>
          <span>Looping</span>
        </Link>
        <Link to="/forum" className="mobile-nav-item">
          <span className="material-symbols-outlined mobile-nav-icon">
            chat
          </span>
          <span>Forum</span>
        </Link>
        <Link to="/account" className="mobile-nav-item active">
          <span className="material-symbols-outlined mobile-nav-icon">
            person
          </span>
          <span>Profile</span>
        </Link>
      </nav>

      {/* Material Icons Font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
        rel="stylesheet"
      />
    </div>
  );
}