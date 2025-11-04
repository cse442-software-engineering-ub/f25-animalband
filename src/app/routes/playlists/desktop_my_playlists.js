import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
    getMyPlaylists,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
} from "../../../api/playlists.js";
import "../forum/desktop_forum.css";
import "./desktop_playlists.css";

const PHP_URL = "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php";

export default function DesktopMyPlaylists() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);

    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState("");


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


    // ===== data =====
    async function refresh() {
        setLoading(true);
        const res = await getMyPlaylists();
        if (res.ok) setPlaylists(res.playlists);
        setLoading(false);
    }
    useEffect(() => { refresh(); }, []);
    function truncateName(name, max = 14) {
        return name.length > max ? name.slice(0, max) + "…" : name;
    }
    async function handleCopyLink(id) {
        const url = `${window.location.origin}${window.location.pathname}#/playlists/${id}`;
        try {
            await navigator.clipboard.writeText(url);
            alert("Playlist link copied!");
        } catch (err) {
            console.error("Copy failed:", err);
            alert("Failed to copy link");
        }
    }

    async function handleCreate(e) {
        e.preventDefault();
        const name = newName.trim();
        if (!name) return;
        setCreating(true);
        const res = await createPlaylist({ name, is_public: false });
        setCreating(false);
        if (res.ok) { setNewName(""); refresh(); }
        else alert(res.error || "Failed to create");
    }

    async function handleRename(id) {
        const name = window.prompt("Rename playlist to:");
        if (!name) return;
        const res = await updatePlaylist({ playlist_id: id, name });
        if (res.ok) refresh(); else alert("Rename failed");
    }

    async function handleTogglePublic(id, current) {
        const res = await updatePlaylist({ playlist_id: id, is_public: !current });
        if (res.ok) refresh(); else alert("Update failed");
    }

    async function handleDelete(id) {
        if (!window.confirm("Delete this playlist? This cannot be undone.")) return;
        const res = await deletePlaylist(id);
        if (res.ok) refresh(); else alert("Delete failed");
    }

    const handleAccountClick = () => {
        if (user) navigate("/account");
        else navigate("/login");
    };


    return (
        <div className="forum-page">
            {/* ===== SIDEBAR ===== */}
            <aside className="forum-sidebar">
                <div className="sidebar-header">
                    <Link to="/">
                        <span className="material-symbols-outlined paw-icon">pets</span>
                        <span className="forum-site-title">ANIMALBAND</span>
                    </Link>
                </div>

                <nav className="sidebar-nav">
                    <ul>
                        <li><button className="df-sidebar-btn" onClick={() => navigate("/my-recordings")}>My Recordings</button></li>
                        <li><button className="df-sidebar-btn active">My Playlists</button></li>
                        <li><button className="df-sidebar-btn" onClick={() => navigate("/stage")}>Back to Stage</button></li>
                        <button className="df-sidebar-btn logout-btn" onClick={() => navigate("/login")}>Log Out</button>
                    </ul>
                </nav>
            </aside>

            {/* ===== MAIN ===== */}
            <div className="forum-main">
                {/* ===== HEADER ===== */}
                <header className="forum-header">
                    <div className="header-left">
                        <h1 className="forum-title">My Playlists</h1>
                        <span className="post-count">{playlists?.length || 0} total</span>
                    </div>

                    <div className="header-right">
                        <form className="plf-create" onSubmit={handleCreate}>
                            <input
                                className="plf-input"
                                placeholder="New playlist name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                maxLength={80}
                            />
                            <button className="new-post-btn" type="submit" disabled={creating || !newName.trim()}>
                                {creating ? "Creating…" : "Create"}
                            </button>
                        </form>

                        {user ? (
                            <img
                                src={`${PHP_URL}/${user.profilePic}`}
                                alt="Profile"
                                className="profile-pic"
                                onClick={handleAccountClick}
                            />
                        ) : (
                            <div className="header-auth-buttons">
                                <button className="nav-btn" onClick={() => navigate("/login")}>Login</button>
                                <button className="nav-btn" onClick={() => navigate("/register")}>Register</button>
                            </div>
                        )}
                    </div>
                </header>

                {/* ===== CONTENT ===== */}
                <main className="forum-content">
                    {loading ? (
                        <div className="plf-grid">
                            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="post-card plf-skel" />)}
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
                                        <span className={`plf-badge ${p.is_public ? "pub" : "priv"}`}>
                                            {p.is_public ? "Public" : "Private"}
                                        </span>
                                    </div>

                                    <div className="plf-actions-row">
                                        <button className="nav-btn" onClick={() => handleRename(p.id)}>Rename</button>
                                        <button className="nav-btn" onClick={() => handleTogglePublic(p.id, !!p.is_public)}>
                                            {p.is_public ? "Make Private" : "Make Public"}
                                        </button>
                                        <button className="nav-btn plf-danger" onClick={() => handleDelete(p.id)}>Delete</button>
                                        {p.is_public ? (
                                            <button
                                                className="btn sm copy-link-btn"
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

            <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
        </div>
    );
}
