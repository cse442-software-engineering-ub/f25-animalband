import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    getPlaylistTracks,
    removeSongFromPlaylist,
    reorderPlaylist,
} from "../../../api/playlists.js";
import { preloadLandingSounds, schedulePlayback } from "../landing/landing_player.js";
import "../forum/desktop_forum.css";
import "./desktop_playlist_details.css";
import "./desktop_playlists.css";


const PHP_URL = "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php";

export default function DesktopPlaylistDetail() {
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
    const stopRef = useRef(null);


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
                setInfo({
                    playlist: res.playlist ?? null,
                    tracks: Array.isArray(res.tracks) ? res.tracks : [],
                });
                setDirty(false);
            } else {
                if (res?.error === "Private playlist") {
                    setInfo(null);
                    alert("This playlist is private.");
                    navigate("/");
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

    useEffect(() => { refresh(); }, [pid]);

    const tracks = info?.tracks ?? [];

    const canEdit =
        !!(info?.playlist?.can_edit ??
            (user && info?.playlist && info.playlist.owner_id === user.ID));

    function onDragStart(e, index) {
        setDragIdx(index);
        e.dataTransfer.effectAllowed = "move";
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

        const write = (s) => {
            for (let i = 0; i < s.length; i++) view.setUint8(offset++, s.charCodeAt(i));
        };
        const set16 = (v) => {
            view.setUint16(offset, v, true);
            offset += 2;
        };
        const set32 = (v) => {
            view.setUint32(offset, v, true);
            offset += 4;
        };

        write("RIFF");
        set32(36 + buffer.length * numCh * 2);
        write("WAVEfmt ");
        set32(16);
        set16(1);
        set16(numCh);
        set32(buffer.sampleRate);
        set32(buffer.sampleRate * numCh * 2);
        set16(numCh * 2);
        set16(16);
        write("data");
        set32(buffer.length * numCh * 2);

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
                        <button className="new-post-btn" onClick={saveOrder} disabled={savingOrder || !dirty || !canEdit}>
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
                                    className={`post-card plf-track ${!canEdit ? "readonly" : ""}`}
                                    draggable={canEdit}
                                    onDragStart={canEdit ? (e) => onDragStart(e, i) : undefined}
                                    onDragOver={canEdit ? onDragOver : undefined}
                                    onDrop={canEdit ? (e) => onDrop(e, i) : undefined}
                                >
                                    {canEdit && <span className="plf-drag" title="Drag to reorder">⋮⋮</span>}

                                    <div className="plf-track-meta">
                                        <div className="plf-track-title">{t.title || `Song #${t.id}`}</div>
                                        {t.description && <div className="plf-track-desc">{t.description}</div>}
                                        <div className="plf-track-by">
                                            by {t.author_name || (t.email ? t.email.split("@")[0] : "Unknown")}
                                        </div>
                                    </div>

                                    <div className="plf-track-actions">
                                        <button
                                            className="song-play-btn"
                                            title={playingIndex === i ? "Stop" : "Play"}
                                            onClick={() => togglePlay(i)}
                                        >
                                            <span className="material-symbols-outlined">
                                                {playingIndex === i ? "stop" : "play_arrow"}
                                            </span>
                                        </button>

                                        <button
                                            className="song-download-btn"
                                            title="Download WAV"
                                            onClick={() => downloadWav(t)}
                                        >
                                            <span className="material-symbols-outlined">download</span>
                                        </button>

                                        {canEdit && (
                                            <button
                                                className="nav-btn plf-danger"
                                                onClick={() => handleRemove(t.id)}
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
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
