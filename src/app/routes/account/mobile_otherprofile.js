import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "./mobile_profile.css";
import "../playlists/desktop_playlists.css";

const PHP_BASE = "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/Gregs_temp/php";

export default function MobileOtherProfile() {
  const navigate = useNavigate();
  const { userId } = useParams();

  const [viewer, setViewer] = useState(null);          // logged-in user
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const [profileUser, setProfileUser] = useState(null); // profile being viewed
  const [playlists, setPlaylists] = useState([]);
  const [stats, setStats] = useState({
    postCount: 0,
    recordingCount: 0,
    likeCount: 0,
  });
  const [loading, setLoading] = useState(true);

  // ===== Fetch logged-in viewer (for header avatar) =====
  useEffect(() => {
    const fetchViewer = async () => {
      try {
        const res = await fetch(`${PHP_BASE}/getUser.php`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.loggedIn) {
          setViewer(data);
        } else {
          // still allow viewing public profile, just no avatar
          setViewer(null);
        }
      } catch (err) {
        console.error("Failed to fetch viewer", err);
      }
    };
    fetchViewer();
  }, []);

  // ===== Fetch other user's public profile =====
  useEffect(() => {
    if (!userId) return;

    const loadOtherUser = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${PHP_BASE}/getPublicProfileById.php?id=${userId}`
        );
        const data = await res.json();

        if (!data.success) throw new Error(data.error || "Failed to load");

        setProfileUser(data.user);
        setStats({
          postCount: data.stats.postCount || 0,
          recordingCount: data.stats.recordingCount || 0,
          likeCount: data.stats.likeCount || 0,
        });
      } catch (err) {
        console.error("Failed to load user profile", err);
        setProfileUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadOtherUser();
  }, [userId]);

  // ===== Fetch that user's public playlists =====
  useEffect(() => {
    if (!userId) return;

    const loadPlaylists = async () => {
      try {
        const res = await fetch(
          `${PHP_BASE}/getPublicPlaylistsByUserId.php?id=${userId}`
        );
        const data = await res.json();
        if (data.success) setPlaylists(data.playlists);
        else setPlaylists([]);
      } catch (err) {
        console.error("Failed to load playlists", err);
        setPlaylists([]);
      }
    };

    loadPlaylists();
  }, [userId]);

  // ===== Navigation helpers =====
  const navigateToForum = (view) => {
    navigate("/forum", { state: { activeView: view } });
    setShowMobileMenu(false);
  };

  return (
    <div className="mobile-profile-page">
      {/* ===== MOBILE HEADER ===== */}
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
          {viewer ? (
            <img
              src={`${PHP_BASE}/${viewer.profilePic}`}
              alt="Profile"
              className="mobile-profile-pic"
              onClick={() => navigate("/account")}
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

      {/* ===== MOBILE NAV MENU ===== */}
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
              className="mobile-nav-btn"
              onClick={() => {
                navigate("/account");
                setShowMobileMenu(false);
              }}
            >
              <span className="material-symbols-outlined">person</span>
              My Profile
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

      {/* ===== MAIN CONTENT ===== */}
      <main className="mobile-profile-content">
        {loading ? (
          <div className="mobile-loading">Loading profile...</div>
        ) : !profileUser ? (
          <div className="mobile-loading">User not found.</div>
        ) : (
          <>
            {/* Avatar + username */}
            <div className="mobile-profile-pic-container">
              <img
                src={`${PHP_BASE}/${profileUser.profilePic}`}
                alt="Profile"
                className="mobile-profile-pic-large"
              />
            </div>
            <h2>{profileUser.username}</h2>

            {/* Profile info (public) */}
            <div className="mobile-profile-info">
              <h3>Profile Information</h3>
              <div className="mobile-info-grid">
                <div className="mobile-info-item">
                  <div className="mobile-info-label">Username</div>
                  <div className="mobile-info-value">
                    {profileUser.username}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats from public endpoints */}
            <div className="mobile-profile-stats">
              <h3>Statistics</h3>
              <div className="mobile-stats-container">
                <div className="mobile-stat-card">
                  <div className="mobile-stat-number">{stats.postCount}</div>
                  <div className="mobile-stat-label">Posts</div>
                </div>
                <div className="mobile-stat-card">
                  <div className="mobile-stat-number">
                    {stats.recordingCount}
                  </div>
                  <div className="mobile-stat-label">Recordings</div>
                </div>
                <div className="mobile-stat-card">
                  <div className="mobile-stat-number">{stats.likeCount}</div>
                  <div className="mobile-stat-label">Likes</div>
                </div>
              </div>
            </div>

            {/* Public Playlists */}
            <div className="mobile-profile-playlists">
              <h3>Public Playlists</h3>

              {playlists.length === 0 ? (
                <p className="mobile-no-playlists">
                  This bandmate has no public playlists.
                </p>
              ) : (
                <div className="plf-grid plf-grid-compact mobile-pl-grid">
                  {playlists.map((p) => (
                    <article
                      key={p.id}
                      className="post-card plf-card plf-card-compact mobile-pl-card"
                      onClick={() => navigate(`/playlists/${p.id}`)}
                    >
                      <div className="plf-card-header">
                        <button
                          className="plf-title-link plf-title-compact"
                          title={p.name}
                          type="button"
                        >
                          {p.name.length > 18
                            ? p.name.slice(0, 18) + "…"
                            : p.name}
                        </button>
                      </div>

                      <div className="plf-compact-meta">
                        <span className="plf-track-title">
                          {p.songCount}{" "}
                          {p.songCount === 1 ? "song" : "songs"}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Bottom Navigation (same as mobile_profile) */}
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
        <Link to="/account" className="mobile-nav-item">
          <span className="material-symbols-outlined mobile-nav-icon">
            person
          </span>
          <span>Profile</span>
        </Link>
      </nav>

      {/* Material Icons */}
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
        rel="stylesheet"
      />
    </div>
  );
}
