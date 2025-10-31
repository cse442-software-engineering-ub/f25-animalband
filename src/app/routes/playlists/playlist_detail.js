import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
    getPlaylistTracks,
    removeSongFromPlaylist,
    reorderPlaylist,
} from "../../../api/playlists.js";
import "../forum/desktop_forum.css";
import "./playlists.css";

const PHP_URL = "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php";

export default function PlaylistDetail() {
    const navigate = useNavigate();
    const { id } = useParams();
    const pid = Number(id);

    const [user, setUser] = useState(null);
    const [info, setInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [savingOrder, setSavingOrder] = useState(false);
    const [dragIdx, setDragIdx] = useState(null);
    const [dirty, setDirty] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${PHP_URL}/getUser.php`, { credentials: "include" });
                const data = await res.json();
                if (data?.loggedIn) setUser(data);
            } catch (e) {
                console.warn("getUser failed", e);
            }
        })();
    }, []);

    async function refresh() {
        try {
            setLoading(true);
            const res = await getPlaylistTracks(pid);
            if (res?.ok) {
                // Normalize to always have an array
                setInfo({
                    playlist: res.playlist ?? null,
                    tracks: Array.isArray(res.tracks) ? res.tracks : [],
                });
                setDirty(false);
            } else {
                alert(res?.error || "Load failed");
                setInfo({ playlist: null, tracks: [] });
            }
        } catch (e) {
            console.error(e);
            alert("Load failed");
            setInfo({ playlist: null, tracks: [] });
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => { refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [pid]);

    const tracks = info?.tracks ?? [];

    function onDragStart(e, index) {
        setDragIdx(index);
        e.dataTransfer.effectAllowed = "move";
        // Some browsers need a payload for DnD to work
        e.dataTransfer.setData("text/plain", String(index));
    }
    function onDragOver(e) { e.preventDefault(); }
    function onDrop(e, index) {
        e.preventDefault();
        if (dragIdx === null || dragIdx === index) return;
        const next = [...tracks];
        const [moved] = next.splice(dragIdx, 1);
        next.splice(index, 0, moved);
        setInfo(prev => ({ ...prev, tracks: next }));
        setDragIdx(null);
        setDirty(true);
    }

    async function saveOrder() {
        if (!info || !dirty) return;
        const order = tracks.map(t => t.id);

        setSavingOrder(true);
        const r = await reorderPlaylist(pid, order);
        setSavingOrder(false);
        if (!r?.ok) alert(r?.error || "Failed to save order");
        else setDirty(false);
    }

    async function handleRemove(songId) {
        const r = await removeSongFromPlaylist(pid, songId);
        if (r?.ok) refresh(); else alert(r?.error || "Remove failed");
    }

    const handleAccountClick = () => {
        if (user) navigate("/account");
        else navigate("/login");
    };

    const headerCount = useMemo(() => tracks.length, [tracks]);

    return (
        <div className="forum-page">
            {/* SIDEBAR */}
            <aside className="forum-sidebar">
                <div className="sidebar-header">
                    <Link to="/">
                        <span className="material-symbols-outlined paw-icon">pets</span>
                        <span className="forum-site-title">ANIMALBAND</span>
                    </Link>
                </div>

                <nav className="sidebar-nav">
                    <ul>
                        <li><button className="df-sidebar-btn" onClick={() => navigate("/")}>Home</button></li>
                        <li><button className="df-sidebar-btn" onClick={() => navigate("/forum")}>Forum</button></li>
                        <li><button className="df-sidebar-btn" onClick={() => navigate("/my-recordings")}>My Recordings</button></li>
                        <li><button className="df-sidebar-btn active" onClick={() => navigate("/playlists")}>My Playlists</button></li>
                        <li><button className="df-sidebar-btn" onClick={() => navigate("/account")}>My Profile</button></li>
                        <button className="df-sidebar-btn logout-btn" onClick={() => navigate("/login")}>Log Out</button>
                    </ul>
                </nav>
            </aside>

            {/* MAIN */}
            <div className="forum-main">
                {/* HEADER */}
                <header className="forum-header">
                    <div className="header-left">
                        <h1 className="forum-title">{info?.playlist?.name || "Playlist"}</h1>
                        <span className="post-count">{headerCount} tracks{dirty ? " • unsaved" : ""}</span>
                    </div>

                    <div className="header-right">
                        <button className="nav-btn" onClick={() => navigate("/playlists")}>Back</button>
                        <button className="new-post-btn" onClick={saveOrder} disabled={savingOrder || !dirty}>
                            {savingOrder ? "Saving…" : "Save Order"}
                        </button>
                        {user ? (
                            <img
                                src={`${PHP_URL}/${user?.profilePic}`}
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

                {/* CONTENT */}
                <main className="forum-content">
                    {loading ? (
                        <ul className="plf-tracks">
                            {Array.from({ length: 5 }).map((_, i) => <li key={i} className="post-card plf-skel" />)}
                        </ul>
                    ) : !info ? (
                        <div className="no-posts"><p>Not found.</p></div>
                    ) : tracks.length === 0 ? (
                        <div className="no-posts"><p>No tracks yet. Use “Add to Playlist” on songs.</p></div>
                    ) : (
                        <ul className="plf-tracks">
                            {tracks.map((t, i) => (
                                <li
                                    key={t.id}
                                    className="post-card plf-track"
                                    draggable
                                    onDragStart={(e) => onDragStart(e, i)}
                                    onDragOver={onDragOver}
                                    onDrop={(e) => onDrop(e, i)}
                                >
                                    <span className="plf-drag">⋮⋮</span>
                                    <div className="plf-track-meta">
                                        <div className="plf-track-title">{t.title || `Song #${t.id}`}</div>
                                        {t.description ? <div className="plf-track-desc">{t.description}</div> : null}
                                    </div>

                                    <div className="plf-track-by">
                                        by {t.author_name || (t.email ? t.email.split("@")[0] : "Unknown")}
                                    </div>


                                    <div className="plf-spacer" />
                                    <button
                                        className="nav-btn plf-danger"
                                        onClick={() => handleRemove(t.id)}
                                    >
                                        Remove
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </main>
            </div>

            <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
        </div>
    );
}
