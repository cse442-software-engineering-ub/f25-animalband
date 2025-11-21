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
import "./mobile_my_playlists.css";

const PHP_URL = "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php";

export default function MobileMyPlaylists() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState("");
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const { modalState, showModal, closeModal } = useCustomModal();

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${PHP_URL}/getUser.php`, { credentials: "include" });
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

    async function refresh() {
        setLoading(true);
        const res = await getMyPlaylists();
        if (res.ok) setPlaylists(res.playlists);
        setLoading(false);
    }

    useEffect(() => { refresh(); }, []);

    function truncateName(name, max = 20) {
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
            setShowCreateForm(false);
            refresh();
            showModal("Playlist created successfully!", "success");
        } else {
            showModal(res.error || "Failed to create playlist", "error");
        }
    }

    async function handleRename(id, currentName) {
        const name = window.prompt("Rename playlist to:", currentName);
        if (!name || name.trim() === currentName) return;
        const res = await updatePlaylist({ playlist_id: id, name: name.trim() });
        if (res.ok) {
            refresh();
            showModal("Playlist renamed successfully!", "success");
        } else {
            showModal("Rename failed", "error");
        }
    }

    async function handleTogglePublic(id, current) {
        const res = await updatePlaylist({ playlist_id: id, is_public: !current });
        if (res.ok) {
            refresh();
            showModal(`Playlist is now ${!current ? "public" : "private"}`, "success");
        } else {
            showModal("Update failed", "error");
        }
    }

    async function handleDelete(id, name) {
        if (!window.confirm(`Delete playlist "${name}"? This cannot be undone.`)) return;
        const res = await deletePlaylist(id);
        if (res.ok) {
            refresh();
            showModal("Playlist deleted successfully", "success");
        } else {
            showModal("Delete failed", "error");
        }
    }

    const handleAccountClick = () => {
        if (user) navigate("/account");
        else navigate("/login");
    };

    if (loading) {
        return <div className="mobile-loading">Loading...</div>;
    }

    return (
        <div className="mobile-playlists-page">
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
                            src={`${PHP_URL}/${user.profilePic}`}
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
                            onClick={() => { navigate("/"); setShowMobileMenu(false); }}
                        >
                            <span className="material-symbols-outlined">home</span>
                            Home
                        </button>
                        <button
                            className="mobile-nav-btn"
                            onClick={() => { navigate("/forum"); setShowMobileMenu(false); }}
                        >
                            <span className="material-symbols-outlined">forum</span>
                            Forum
                        </button>
                        <button
                            className="mobile-nav-btn"
                            onClick={() => { navigate("/my-recordings"); setShowMobileMenu(false); }}
                        >
                            <span className="material-symbols-outlined">mic</span>
                            My Recordings
                        </button>
                        <button
                            className="mobile-nav-btn active"
                            onClick={() => setShowMobileMenu(false)}
                        >
                            <span className="material-symbols-outlined">playlist_play</span>
                            My Playlists
                        </button>
                        <button
                            className="mobile-nav-btn"
                            onClick={() => { navigate("/account"); setShowMobileMenu(false); }}
                        >
                            <span className="material-symbols-outlined">person</span>
                            My Profile
                        </button>
                        <button
                            className="mobile-nav-btn logout"
                            onClick={() => { navigate("/login"); setShowMobileMenu(false); }}
                        >
                            <span className="material-symbols-outlined">logout</span>
                            Log Out
                        </button>
                    </nav>
                </div>
            )}

            {/* Main Content */}
            <main className="mobile-main">
                {/* Page Header */}
                <div className="mobile-page-header">
                    <div className="mobile-title-section">
                        <h1 className="mobile-page-title">My Playlists</h1>
                        <span className="mobile-post-count">{playlists?.length || 0} total</span>
                    </div>
                </div>

                {/* Create Playlist Button */}
                <div className="mobile-playlist-controls">
                    <button
                        className="mobile-new-post-btn"
                        onClick={() => setShowCreateForm(true)}
                    >
                        <span className="material-symbols-outlined">add</span>
                        Create Playlist
                    </button>
                </div>

                {/* Playlists List */}
                <div className="mobile-playlists-container">
                    {playlists.length === 0 ? (
                        <div className="mobile-no-posts">
                            <span className="material-symbols-outlined">playlist_play</span>
                            <p>No playlists yet. Create your first playlist!</p>
                        </div>
                    ) : (
                        playlists.map((p) => (
                            <div key={p.id} className="mobile-playlist-card">
                                <div className="mobile-playlist-header">
                                    <button
                                        className="mobile-playlist-title"
                                        onClick={() => navigate(`/playlists/${p.id}`)}
                                    >
                                        {truncateName(p.name)}
                                    </button>
                                    <span className={`mobile-playlist-badge ${p.is_public ? "pub" : "priv"}`}>
                                        {p.is_public ? "Public" : "Private"}
                                    </span>
                                </div>

                                <div className="mobile-playlist-actions">
                                    <button
                                        className="mobile-action-btn"
                                        onClick={() => handleRename(p.id, p.name)}
                                    >
                                        Rename
                                    </button>
                                    <button
                                        className="mobile-action-btn"
                                        onClick={() => handleTogglePublic(p.id, !!p.is_public)}
                                    >
                                        {p.is_public ? "Make Private" : "Make Public"}
                                    </button>
                                    {p.is_public ? (
                                        <button
                                            className="mobile-action-btn"
                                            onClick={() => handleCopyLink(p.id)}
                                        >
                                            Copy Link
                                        </button>
                                    ) : null}
                                    <button
                                        className="mobile-action-btn danger"
                                        onClick={() => handleDelete(p.id, p.name)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
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
                <Link to="/playlists" className="mobile-nav-item active">
                    <span className="material-symbols-outlined mobile-nav-icon">playlist_play</span>
                    <span>Playlists</span>
                </Link>
            </nav>

            {/* Create Playlist Popup */}
            {showCreateForm && (
                <div className="mobile-popup-overlay">
                    <div className="mobile-popup-content">
                        <div className="mobile-popup-header">
                            <h2>Create New Playlist</h2>
                            <button
                                className="mobile-close-btn"
                                onClick={() => {
                                    setShowCreateForm(false);
                                    setNewName("");
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <div className="mobile-popup-body">
                            <div className="mobile-form-group">
                                <label>Playlist Name:</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Enter playlist name"
                                    maxLength={80}
                                />
                            </div>
                        </div>
                        <div className="mobile-popup-footer">
                            <button
                                className="mobile-cancel-btn"
                                onClick={() => {
                                    setShowCreateForm(false);
                                    setNewName("");
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="mobile-submit-btn"
                                onClick={handleCreate}
                                disabled={creating || !newName.trim()}
                            >
                                {creating ? "Creating…" : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <CustomModal
                isOpen={modalState.isOpen}
                onClose={closeModal}
                message={modalState.message}
                type={modalState.type}
                title={modalState.title}
            />

            <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
        </div>
    );
}