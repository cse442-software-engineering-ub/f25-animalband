import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    getPlaylistTracks,
    removeSongFromPlaylist,
    reorderPlaylist,
} from "../../../api/playlists.js";
import { preloadLandingSounds, schedulePlayback } from "../landing/landing_player.js";
import "./mobile_playlist_details.css";

const PHP_URL = "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php";

export default function MobilePlaylistDetail() {
    const navigate = useNavigate();
    const { id } = useParams();
    const pid = Number(id);

    const [user, setUser] = useState(null);
    const [info, setInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [savingOrder, setSavingOrder] = useState(false);
    const [dragIdx, setDragIdx] = useState(null);
    const [dirty, setDirty] = useState(false);
    const [buffers, setBuffers] = useState(null);
    const [playingIndex, setPlayingIndex] = useState(-1);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const stopRef = useRef(null);

    // touch dragging refs
    const touchDraggingRef = useRef(false);
    const listContainerRef = useRef(null);

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

    useEffect(() => {
        (async () => {
            try {
                setBuffers(await preloadLandingSounds());
            } catch (e) {
                console.error("preloadLandingSounds failed", e);
            }
        })();
        return () => {
            if (stopRef.current) {
                stopRef.current();
                stopRef.current = null;
            }
            setPlayingIndex(-1);
        };
    }, []);

    async function refresh() {
        try {
            setLoading(true);
            const res = await getPlaylistTracks(pid);
            if (res?.ok) {
                setInfo({
                    playlist: res.playlist ?? null,
                    tracks: Array.isArray(res.tracks) ? res.tracks : [],
                });
                setDirty(false);
            } else {
                if (res?.error === "Private playlist") {
                    setInfo(null);
                    alert("This playlist is private.");
                    navigate("/playlists");
                } else {
                    alert(res?.error || "Load failed");
                    setInfo({ playlist: null, tracks: [] });
                }
            }
        } catch (e) {
            console.error(e);
            alert("Load failed");
            setInfo({ playlist: null, tracks: [] });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { refresh(); }, [pid]);

    const tracks = info?.tracks ?? [];
    const canEdit = !!(info?.playlist?.can_edit ??
        (user && info?.playlist && info.playlist.owner_id === user.ID));

    function stopAll() {
        if (stopRef.current) {
            stopRef.current();
            stopRef.current = null;
        }
    }

    function coerceRecording(rec) {
        if (!rec) return [];
        if (Array.isArray(rec)) return rec;
        try {
            const parsed = JSON.parse(rec);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    function togglePlay(idx) {
        if (!buffers) return;
        if (playingIndex === idx) {
            stopAll();
            setPlayingIndex(-1);
            return;
        }
        stopAll();
        const song = tracks[idx];
        if (!song) return;
        const recording = coerceRecording(song.recording);
        stopRef.current = schedulePlayback(buffers, recording, () => {
            setPlayingIndex(-1);
            stopRef.current = null;
        });
        setPlayingIndex(idx);
    }

    async function downloadWav(song) {
        if (!buffers || !song?.recording) return;
        const rec = coerceRecording(song.recording);
        const durationMs = rec.length ? rec[rec.length - 1].time + 1000 : 0;
        const duration = durationMs / 1000;
        const offlineCtx = new OfflineAudioContext(2, 44100 * duration, 44100);

        rec.forEach(({ key, time }) => {
            const buf = buffers[key];
            if (!buf) return;
            const node = offlineCtx.createBufferSource();
            node.buffer = buf;
            node.connect(offlineCtx.destination);
            node.start(time / 1000);
        });

        const rendered = await offlineCtx.startRendering();
        const wavBlob = bufferToWav(rendered);
        const url = URL.createObjectURL(wavBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${song.title || `song_${song.id}`}.wav`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function bufferToWav(buffer) {
        const numCh = buffer.numberOfChannels;
        const length = buffer.length * numCh * 2 + 44;
        const ab = new ArrayBuffer(length);
        const view = new DataView(ab);
        let offset = 0;

        const write = (s) => { for (let i = 0; i < s.length; i++) view.setUint8(offset++, s.charCodeAt(i)); };
        const set16 = (v) => { view.setUint16(offset, v, true); offset += 2; };
        const set32 = (v) => { view.setUint32(offset, v, true); offset += 4; };

        write("RIFF"); set32(36 + buffer.length * numCh * 2);
        write("WAVEfmt "); set32(16); set16(1); set16(numCh);
        set32(buffer.sampleRate); set32(buffer.sampleRate * numCh * 2);
        set16(numCh * 2); set16(16);
        write("data"); set32(buffer.length * numCh * 2);

        const ch0 = buffer.getChannelData(0);
        const ch1 = numCh > 1 ? buffer.getChannelData(1) : ch0;
        for (let i = 0; i < buffer.length; i++) {
            for (const s of [ch0[i], ch1[i]]) {
                const clamped = Math.max(-1, Math.min(1, s));
                view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
                offset += 2;
            }
        }
        return new Blob([view], { type: "audio/wav" });
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

    async function handleRemove(songId, songTitle) {
        if (!window.confirm(`Remove "${songTitle}" from playlist?`)) return;
        const r = await removeSongFromPlaylist(pid, songId);
        if (r?.ok) refresh(); else alert(r?.error || "Remove failed");
    }

    const handleAccountClick = () => {
        if (user) navigate("/account");
        else navigate("/login");
    };

    const headerCount = useMemo(() => tracks.length, [tracks]);

    // ---------- Drag helpers (HTML5 + Touch) ----------
    const setTracks = (updater) => {
        setInfo(prev => {
            const nextTracks = typeof updater === "function" ? updater(prev?.tracks ?? []) : updater;
            return { ...(prev || {}), tracks: nextTracks };
        });
    };

    function moveItem(arr, from, to) {
        if (from === to || from == null || to == null) return arr;
        const next = arr.slice();
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        return next;
    }

    // HTML5 drag
    function onDragStart(e, index) {
        if (!canEdit) return;
        setDragIdx(index);
        e.dataTransfer.effectAllowed = "move";
        // required for Firefox to start drag
        e.dataTransfer.setData("text/plain", String(index));
        e.currentTarget.classList.add("m-dragging");
    }

    function onDragOver(e, overIndex) {
        if (!canEdit) return;
        e.preventDefault();
        if (dragIdx == null || overIndex == null || dragIdx === overIndex) return;
        setTracks(prev => moveItem(prev, dragIdx, overIndex));
        setDragIdx(overIndex);
        setDirty(true);
    }

    function onDragEnd(e) {
        e.currentTarget.classList.remove("m-dragging");
    }

    // Touch drag (no HTML5 DnD on iOS)
    function touchStart(index) {
        if (!canEdit) return;
        touchDraggingRef.current = true;
        setDragIdx(index);
    }

    function indexFromTouch(e) {
        const t = e.touches[0];
        if (!t) return null;
        const el = document.elementFromPoint(t.clientX, t.clientY);
        if (!el) return null;
        const item = el.closest("[data-track-index]");
        if (!item) return null;
        const i = Number(item.getAttribute("data-track-index"));
        return Number.isFinite(i) ? i : null;
    }

    function touchMove(e) {
        if (!canEdit || !touchDraggingRef.current) return;
        e.preventDefault(); // prevent scroll while reordering
        const overIndex = indexFromTouch(e);
        if (overIndex == null || dragIdx == null || overIndex === dragIdx) return;
        setTracks(prev => moveItem(prev, dragIdx, overIndex));
        setDragIdx(overIndex);
        setDirty(true);
    }

    function touchEnd() {
        touchDraggingRef.current = false;
        setDragIdx(null);
    }

    if (loading) {
        return <div className="mobile-loading">Loading...</div>;
    }

    return (
        <div className="mobile-playlist-detail-page">
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
                            src={`${PHP_URL}/${user?.profilePic}`}
                            alt="Profile"
                            className="mobile-profile-pic"
                            onClick={handleAccountClick}
                        />
                    ) : (
                        <button className="mobile-login-btn" onClick={() => navigate("/login")}>
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
                        <button className="mobile-close-btn" onClick={() => setShowMobileMenu(false)}>
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    <nav className="mobile-nav">
                        <button className="mobile-nav-btn" onClick={() => { navigate("/"); setShowMobileMenu(false); }}>
                            <span className="material-symbols-outlined">home</span>
                            Home
                        </button>
                        <button className="mobile-nav-btn" onClick={() => { navigate("/forum"); setShowMobileMenu(false); }}>
                            <span className="material-symbols-outlined">forum</span>
                            Forum
                        </button>
                        <button className="mobile-nav-btn" onClick={() => { navigate("/my-recordings"); setShowMobileMenu(false); }}>
                            <span className="material-symbols-outlined">mic</span>
                            My Recordings
                        </button>
                        <button className="mobile-nav-btn active" onClick={() => { navigate("/playlists"); setShowMobileMenu(false); }}>
                            <span className="material-symbols-outlined">playlist_play</span>
                            My Playlists
                        </button>
                        <button className="mobile-nav-btn" onClick={() => { navigate("/account"); setShowMobileMenu(false); }}>
                            <span className="material-symbols-outlined">person</span>
                            My Profile
                        </button>
                        <button className="mobile-nav-btn logout" onClick={() => { navigate("/login"); setShowMobileMenu(false); }}>
                            <span className="material-symbols-outlined">logout</span>
                            Log Out
                        </button>
                    </nav>
                </div>
            )}

            {/* Main Content */}
            <main className="mobile-main">
                <div className="mobile-page-header">
                    <div className="mobile-title-section">
                        <h1 className="mobile-page-title">{info?.playlist?.name || "Playlist"}</h1>
                        <span className="mobile-post-count">
                            {headerCount} tracks{dirty ? " • unsaved" : ""}
                        </span>
                    </div>
                </div>

                <div className="mobile-playlist-detail-controls">
                    <button className="mobile-action-btn" onClick={() => navigate("/playlists")}>
                        Back to Playlists
                    </button>
                    {canEdit && (
                        <button className="mobile-new-post-btn" onClick={saveOrder} disabled={savingOrder || !dirty}>
                            {savingOrder ? "Saving…" : "Save Order"}
                        </button>
                    )}
                </div>

                <div
                    className="mobile-tracks-container"
                    ref={listContainerRef}
                    onTouchMove={touchMove}
                    onTouchEnd={touchEnd}
                    onTouchCancel={touchEnd}
                >
                    {!info ? (
                        <div className="mobile-no-posts">
                            <p>Playlist not found.</p>
                        </div>
                    ) : tracks.length === 0 ? (
                        <div className="mobile-no-posts">
                            <span className="material-symbols-outlined">music_note</span>
                            <p>No tracks yet. Use "Add to Playlist" on songs.</p>
                        </div>
                    ) : (
                        tracks.map((t, i) => (
                            <div
                                key={t.id}
                                className={`mobile-track-card${dragIdx === i ? " m-drag-active" : ""}`}
                                data-track-index={i}
                                draggable={canEdit}
                                onDragStart={(e) => onDragStart(e, i)}
                                onDragOver={(e) => onDragOver(e, i)}
                                onDragEnd={onDragEnd}
                                onTouchStart={() => touchStart(i)}
                            >
                                <div className="mobile-track-content">
                                    <div className="m-drag-handle" title="Drag to reorder">
                                        <span className="material-symbols-outlined">drag_indicator</span>
                                    </div>

                                    <div className="mobile-track-meta">
                                        <div className="mobile-track-title">{t.title || `Song #${t.id}`}</div>
                                        {t.description && <div className="mobile-track-desc">{t.description}</div>}
                                        <div className="mobile-track-by">
                                            by {t.author_name || (t.email ? t.email.split("@")[0] : "Unknown")}
                                        </div>
                                    </div>

                                    <div className="mobile-track-actions">
                                        <button
                                            className="mobile-song-btn play"
                                            aria-label={playingIndex === i ? "Stop" : "Play"}
                                            title={playingIndex === i ? "Stop" : "Play"}
                                            onClick={() => togglePlay(i)}
                                        >
                                            <span className="material-symbols-outlined">
                                                {playingIndex === i ? "stop" : "play_arrow"}
                                            </span>
                                        </button>

                                        <button
                                            className="mobile-song-btn download"
                                            title="Download WAV"
                                            aria-label="Download WAV"
                                            onClick={() => downloadWav(t)}
                                        >
                                            <span className="material-symbols-outlined">download</span>
                                        </button>

                                        {canEdit && (
                                            <button
                                                className="mobile-song-btn danger"
                                                onClick={() => handleRemove(t.id, t.title || `Song #${t.id}`)}
                                                title="Remove from playlist"
                                                aria-label="Remove from playlist"
                                            >
                                                <span className="material-symbols-outlined">delete</span>
                                            </button>
                                        )}
                                    </div>
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

            <link
                href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
                rel="stylesheet"
            />
        </div>
    );
}
