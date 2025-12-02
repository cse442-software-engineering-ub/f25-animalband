import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  getMyPlaylists,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
} from "../../../api/playlists.js";
import CustomModal from "../../components/CustomModal";
import useCustomModal from "../../components/useCustomModal";
import "../forum/desktop_forum.css";
import "./desktop_playlists.css";

const PHP_URL =
  "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php";

export default function DesktopMyPlaylists() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const { modalState, showModal, closeModal } = useCustomModal();

  // Custom modal states for prompts and confirms
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [promptData, setPromptData] = useState({
    title: "",
    message: "",
    onConfirm: null,
    inputValue: "",
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState({
    title: "",
    message: "",
    onConfirm: null,
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${PHP_URL}/getUser.php`, {
          credentials: "include",
        });
        const data = await res.json();

        if (data?.loggedIn) {
          setUser(data);
        } else {
          navigate("/login");
        }
      } catch (e) {
        console.warn("getUser failed", e);
        navigate("/login");
      }
    })();
  }, [navigate]);

  // Custom modal functions
  const showPrompt = (title, message, onConfirm) => {
    setPromptData({ title, message, onConfirm, inputValue: "" });
    setShowPromptModal(true);
  };

  const showConfirm = (title, message, onConfirm) => {
    setConfirmData({ title, message, onConfirm });
    setShowConfirmModal(true);
  };

  const handlePromptConfirm = () => {
    if (promptData.onConfirm && promptData.inputValue.trim()) {
      promptData.onConfirm(promptData.inputValue.trim());
    }
    setShowPromptModal(false);
    setPromptData({ title: "", message: "", onConfirm: null, inputValue: "" });
  };

  const handleConfirmConfirm = () => {
    if (confirmData.onConfirm) {
      confirmData.onConfirm();
    }
    setShowConfirmModal(false);
    setConfirmData({ title: "", message: "", onConfirm: null });
  };

  // ===== data =====
  async function refresh() {
    setLoading(true);
    const res = await getMyPlaylists();
    if (res.ok) setPlaylists(res.playlists);
    setLoading(false);
  }
  useEffect(() => {
    refresh();
  }, []);

  function truncateName(name, max = 14) {
    return name.length > max ? name.slice(0, max) + "…" : name;
  }

  async function handleCopyLink(id) {
    const url = `${window.location.origin}${window.location.pathname}#/playlists/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      showModal("Playlist link copied!", "success");
    } catch (err) {
      console.error("Copy failed:", err);
      showModal("Failed to copy link", "error");
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    const res = await createPlaylist({ name, is_public: false });
    setCreating(false);
    if (res.ok) {
      setNewName("");
      refresh();
      showModal("Playlist created successfully!", "success");
    } else showModal(res.error || "Failed to create playlist", "error");
  }

  async function handleRename(id) {
    showPrompt(
      "Rename Playlist",
      "Enter new name for this playlist:",
      async (name) => {
        const res = await updatePlaylist({ playlist_id: id, name });
        if (res.ok) {
          refresh();
          showModal("Playlist renamed successfully!", "success");
        } else {
          showModal("Rename failed", "error");
        }
      }
    );
  }

  async function handleTogglePublic(id, current) {
    const res = await updatePlaylist({ playlist_id: id, is_public: !current });
    if (res.ok) {
      refresh();
      showModal(
        `Playlist is now ${!current ? "public" : "private"}`,
        "success"
      );
    } else {
      showModal("Update failed", "error");
    }
  }

  async function handleDelete(id) {
    showConfirm(
      "Delete Playlist",
      "Are you sure you want to delete this playlist? This action cannot be undone.",
      async () => {
        const res = await deletePlaylist(id);
        if (res.ok) {
          refresh();
          showModal("Playlist deleted successfully", "success");
        } else {
          showModal("Delete failed", "error");
        }
      }
    );
  }

  const handleAccountClick = () => {
    if (user) navigate("/account");
    else navigate("/login");
  };

  return (
    <div className="forum-page">
      {/* ===== HEADER (Matching Profile & Forum) ===== */}
      <header className="forum-header">
        <Link to="/" className="logo-section">
          <span className="material-symbols-outlined paw-icon">pets</span>
          <h1 className="site-title">ANIMALBAND</h1>
        </Link>
        <div className="header-buttons">
          {user ? (
            <img
              src={`${PHP_URL}/${user.profilePic}`}
              alt="Profile"
              className="profile-pic"
              onClick={handleAccountClick}
            />
          ) : (
            <div className="header-auth-buttons">
              <button className="nav-btn" onClick={() => navigate("/login")}>
                Login
              </button>
              <button className="nav-btn" onClick={() => navigate("/register")}>
                Register
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ===== MAIN LAYOUT ===== */}
      <div className="forum-layout">
        {/* ===== SIDEBAR (Matching Profile & Forum) ===== */}
        <aside className="forum-sidebar">
          <div className="sidebar-header">
            <h3>Menu</h3>
          </div>

          <nav className="sidebar-nav">
            <ul>
              <li>
                <button
                  className="df-sidebar-btn"
                  onClick={() => navigate("/")}
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  className="df-sidebar-btn"
                  onClick={() => navigate("/forum")}
                >
                  Forum
                </button>
              </li>
              <li>
                <button
                  className="df-sidebar-btn"
                  onClick={() => navigate("/my-recordings")}
                >
                  My Recordings
                </button>
              </li>
              <li>
                <button
                  className="df-sidebar-btn"
                  onClick={() => navigate("/playlists")}
                >
                  My Playlists
                </button>
              </li>
              <li>
                <button
                  className="df-sidebar-btn"
                  onClick={() => navigate("/stage")}
                >
                  Back to Stage
                </button>
              </li>
              <li>
                <button
                  className="df-sidebar-btn logout-btn"
                  onClick={() => navigate("/login")}
                >
                  Logout
                </button>
              </li>
            </ul>
          </nav>
        </aside>

        {/* ===== MAIN CONTENT ===== */}
        <main className="forum-main">
          {/* ===== CONTENT HEADER ===== */}
          <div className="content-header">
            <div>
              <h1>My Playlists</h1>
              <span className="post-count">{playlists?.length || 0} total</span>
            </div>

            <form className="plf-create" onSubmit={handleCreate}>
              <input
                className="plf-input"
                placeholder="New playlist name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={80}
              />
              <button
                className="new-post-btn"
                type="submit"
                disabled={creating || !newName.trim()}
              >
                {creating ? "Creating…" : "Create"}
              </button>
            </form>
          </div>

          {/* ===== PLAYLISTS CONTENT ===== */}
          {loading ? (
            <div className="plf-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="post-card plf-skel" />
              ))}
            </div>
          ) : playlists.length === 0 ? (
            <div className="no-posts">
              <p>No playlists yet. Use the form above to create one.</p>
            </div>
          ) : (
            <div className="plf-grid">
              {playlists.map((p) => (
                <article key={p.id} className="post-card plf-card">
                  <div className="plf-card-header">
                    <button
                      className="plf-title-link"
                      title={p.name}
                      onClick={() => navigate(`/playlists/${p.id}`)}
                    >
                      {truncateName(p.name)}
                    </button>
                    <span
                      className={`plf-badge ${p.is_public ? "pub" : "priv"}`}
                    >
                      {p.is_public ? "Public" : "Private"}
                    </span>
                  </div>

                  <div className="plf-actions-row">
                    <button
                      className="nav-btn"
                      onClick={() => handleRename(p.id)}
                    >
                      Rename
                    </button>
                    <button
                      className="nav-btn"
                      onClick={() => handleTogglePublic(p.id, !!p.is_public)}
                    >
                      {p.is_public ? "Make Private" : "Make Public"}
                    </button>
                    <button
                      className="nav-btn plf-danger"
                      onClick={() => handleDelete(p.id)}
                    >
                      Delete
                    </button>
                    {p.is_public ? (
                      <button
                        className="nav-btn copy-link-btn"
                        onClick={() => handleCopyLink(p.id)}
                      >
                        Copy Link
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Custom Alert/Success Modal */}
      <CustomModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        message={modalState.message}
        type={modalState.type}
        title={modalState.title}
      />

      {/* Custom Prompt Modal */}
      {showPromptModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowPromptModal(false)}
        >
          <div
            className="modal-box prompt-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header info">
              <h3>{promptData.title}</h3>
            </div>
            <div className="modal-content">
              <p>{promptData.message}</p>
              <input
                type="text"
                value={promptData.inputValue}
                onChange={(e) =>
                  setPromptData({ ...promptData, inputValue: e.target.value })
                }
                onKeyDown={(e) => e.key === "Enter" && handlePromptConfirm()}
                placeholder="Enter value..."
                autoFocus
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "2px solid #ccc",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  marginTop: "10px",
                }}
              />
            </div>
            <div className="form-buttons">
              <button onClick={() => setShowPromptModal(false)}>Cancel</button>
              <button
                onClick={handlePromptConfirm}
                className="btn-primary"
                disabled={!promptData.inputValue.trim()}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirm Modal */}
      {showConfirmModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            className="modal-box confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header warning">
              <h3>{confirmData.title}</h3>
            </div>
            <div className="modal-content">
              <p style={{ whiteSpace: "pre-line" }}>{confirmData.message}</p>
            </div>
            <div className="form-buttons">
              <button onClick={() => setShowConfirmModal(false)}>Cancel</button>
              <button onClick={handleConfirmConfirm} className="btn-danger">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
        rel="stylesheet"
      />
    </div>
  );
}