import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import "./mobile_profile.css";

export default function MobileProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
  
  const handleLogout = async () => {
    try {
      await fetch(
        "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php/logout.php",
        {
          method: "POST",
          credentials: "include",
        }
      );

      setUser(null);
      navigate("/"); // redirect to homepage
    } catch (err) {
      console.error("Logout failed", err);
      alert("Failed to log out. Please try again.");
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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleNavigation = (path) => {
    navigate(path);
    closeSidebar();
  };

  return (
    <div className="mobile-profile-page">
      {/* Header */}
      <header className="mobile-header">
        <button className="mobile-menu-toggle" onClick={toggleSidebar}>
          <span className="material-symbols-outlined">menu</span>
        </button>
        
        <Link to="/" className="mobile-logo-section">
          <span className="material-symbols-outlined mobile-paw-icon">pets</span>
          <h1 className="mobile-site-title">ANIMALBAND</h1>
        </Link>
      </header>

      {/* Sidebar Overlay */}
      <div 
        className={`mobile-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={closeSidebar}
      />

      {/* Mobile Sidebar */}
      <aside className={`mobile-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="mobile-sidebar-header">
          <h3>Menu</h3>
          <button className="mobile-sidebar-close" onClick={closeSidebar}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <ul>
          <li>
            <button onClick={() => handleNavigation("/posts")}>
              <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
                article
              </span>
              My Posts
            </button>
          </li>
          <li>
            <button onClick={() => handleNavigation("/recordings")}>
              <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
                library_music
              </span>
              My Recordings
            </button>
          </li>
          <li>
            <button onClick={() => handleNavigation("/account/edit")}>
              <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
                edit
              </span>
              Edit Account
            </button>
          </li>
          <li>
            <button onClick={() => handleNavigation("/stage")}>
              <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
                piano
              </span>
              Back to Stage
            </button>
          </li>
          <li>
            <button onClick={handleLogout}>
              <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}>
                logout
              </span>
              Logout
            </button>
          </li>
        </ul>
      </aside>

      {/* Main Profile Content */}
      <main className="mobile-profile-content">
        {user ? (
          <>
            <div className="mobile-profile-pic-container" onClick={handleProfilePicClick}>
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
                  <div className="mobile-info-value">{user.email || "Not provided"}</div>
                </div>
                <div className="mobile-info-item">
                  <div className="mobile-info-label">Member Since</div>
                  <div className="mobile-info-value">{user.joinDate || "Recently joined"}</div>
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
          <div className="mobile-loading">
            Loading profile...
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        <Link to="/stage" className="mobile-nav-item">
          <span className="material-symbols-outlined mobile-nav-icon">piano</span>
          <span>Stage</span>
        </Link>
        <Link to="/looping" className="mobile-nav-item">
          <span className="material-symbols-outlined mobile-nav-icon">instant_mix</span>
          <span>Looping</span>
        </Link>
        <Link to="/forum" className="mobile-nav-item">
          <span className="material-symbols-outlined mobile-nav-icon">chat</span>
          <span>Forum</span>
        </Link>
        <Link to="/account" className="mobile-nav-item active">
          <span className="material-symbols-outlined mobile-nav-icon">person</span>
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