import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import "./ProfilePage.css";

const ProfilePage = ({ handleNavigation, handleAccountClick, userEmail }) => {
  const [profilePic, setProfilePic] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Fetch profile picture from backend when page loads
    fetch(`http://localhost/getProfilePic.php?email=${encodeURIComponent(userEmail)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.imagePath) {
          setProfilePic(`http://localhost/${data.imagePath}`);
        } else {
          setProfilePic(null); // default will be shown
        }
      });
  }, [userEmail]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profilePic", file);
    formData.append("email", userEmail);

    const response = await fetch("http://localhost/uploadProfilePic.php", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    if (result.success) {
      setProfilePic(`http://localhost/${result.imagePath}`);
    } else {
      alert("Error uploading profile picture");
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
          <button className="btn-login" onClick={() => handleNavigation("/login")}>Login</button>
          <button className="btn-register" onClick={() => handleNavigation("/register")}>Register</button>
          <button className="btn-account" onClick={() => handleAccountClick()}>Account</button>
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
            <div className="profile-picture-wrapper" onClick={() => fileInputRef.current.click()}>
              <img
                src={profilePic || "https://via.placeholder.com/120"}
                alt="Profile"
                className="profile-picture"
              />
              <div className="edit-overlay">Edit</div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              accept="image/*"
              onChange={handleFileChange}
            />
            <h2 className="username">Username</h2>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProfilePage;