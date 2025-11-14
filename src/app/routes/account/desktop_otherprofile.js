import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "./desktop_profile.css";
import "../playlists/desktop_playlists.css";


const PHP_BASE = "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/Gregs_temp/php";

export default function DesktopOtherProfile() {
  const navigate = useNavigate();
  const { userId } = useParams();   // <-- use ID, not username

  const [viewer, setViewer] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    postCount: 0,
    recordingCount: 0,
    likeCount: 0,
  });
  const loadOtherUser = async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php/getPublicProfileById.php?id=${userId}`);
      const text = await res.text();
      console.log("PROFILE RAW RESPONSE:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Failed to parse profile JSON", e);
        throw e;
      }

      if (!data.success) throw new Error(data.message);

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

  // Fetch logged-in user
  useEffect(() => {
    const loadViewer = async () => {
      try {
        const res = await fetch(`${PHP_BASE}/getUser.php`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.loggedIn) setViewer(data);
      } catch (err) {
        console.error(err);
      }
    };
    loadViewer();
  }, []);

  // Fetch profile info for OTHER user
  useEffect(() => {
    if (!userId) return;

    const loadOtherUser = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${PHP_BASE}/getPublicProfileById.php?id=${userId}`);
        const data = await res.json();

        if (!data.success) throw new Error(data.message);

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

  // Fetch their public playlists
  useEffect(() => {
    if (!userId) return;

    const loadPlaylists = async () => {
      try {
        const res = await fetch(`${PHP_BASE}/getPublicPlaylistsByUserId.php?id=${userId}`);
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

  return (
    <div className="profile-page">
      <header className="header">
        <Link to="/" className="logo-section">
          <span className="material-symbols-outlined paw-icon">pets</span>
          <h1 className="site-title">ANIMALBAND</h1>
        </Link>

        <div className="header-buttons">
          {viewer && (
            <img
              src={`${PHP_BASE}/${viewer.profilePic}`}
              className="profile-pic"
              onClick={() => navigate("/account")}
              alt="Profile"
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
          </ul>
        </aside>

        <main className="profile-content">
          {loading ? (
            <p>Loading profile...</p>
          ) : !profileUser ? (
            <p>User not found.</p>
          ) : (
            <>
              <div className="profile-pic-container">
                <img
                  src={`${PHP_BASE}/${profileUser.profilePic}`}
                  className="profile-pic-large"
                  alt="Profile"
                />
              </div>

              <h2>{profileUser.username}</h2>

              <div className="profile-info">
                <h3>Profile Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Username:</span>
                    <div className="info-value">{profileUser.username}</div>
                  </div>
                </div>
              </div>

              <div className="profile-stats">
                <h3>Statistics</h3>
                <div className="stats-container">
                  <div className="stat-card">
                    <div className="stat-number">{stats.postCount}</div>
                    <div className="stat-label">Posts</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{stats.recordingCount}</div>
                    <div className="stat-label">Recordings</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{stats.likeCount}</div>
                    <div className="stat-label">Likes</div>
                  </div>
                </div>
              </div>

              <div className="profile-playlists">
                <h3>Public Playlists</h3>

                {playlists.length === 0 ? (
                  <p>This user has no public playlists</p>
                ) : (
                  <div className="plf-grid plf-grid-compact">
                    {playlists.map((p) => (
                      <article
                        key={p.id}
                        className="post-card plf-card plf-card-compact"
                        onClick={() => navigate(`/playlists/${p.id}`)}
                      >
                        <div className="plf-card-header">
                          <button
                            className="plf-title-link plf-title-compact"
                            title={p.name}
                            type="button"
                          >
                            {p.name.length > 18 ? p.name.slice(0, 18) + "…" : p.name}
                          </button>
                          <span className="plf-badge pub">Public</span>
                        </div>

                        <div className="plf-compact-meta">
                          <span className="plf-track-title">
                            {p.songCount} {p.songCount === 1 ? "song" : "songs"}
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
      </div>
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
        rel="stylesheet"
      />
    </div>
  );
}
