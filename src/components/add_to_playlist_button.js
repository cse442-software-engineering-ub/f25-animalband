import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getMyPlaylists, addSongToPlaylist, createPlaylist } from "../api/playlists.js";

export default function AddToPlaylistButton({ songId, compact = false, onAdded }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [playlists, setPlaylists] = useState([]);
    const [newName, setNewName] = useState("");

    useEffect(() => {
        if (!open) return;
        (async () => {
            const res = await getMyPlaylists();
            if (res.ok) setPlaylists(res.playlists);
        })();
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKey = (e) => (e.key === "Escape") && setOpen(false);
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = prevOverflow;
            window.removeEventListener("keydown", onKey);
        };
    }, [open]);

    async function handleAdd(pid) {
        console.log("Adding", { playlist_id: pid, song_id: songId });

        setLoading(true);
        const res = await addSongToPlaylist(pid, songId);
        setLoading(false);
        if (res.ok) {
            if (onAdded) onAdded(pid);
            setOpen(false);
        } else {
            alert(res.error || "Failed to add");
        }
    }


    async function handleCreateAndAdd() {
        const name = newName.trim();
        if (!name) return;
        setLoading(true);
        const made = await createPlaylist({ name, is_public: false });
        if (made.ok) {
            const res = await addSongToPlaylist(made.playlist_id, songId);
            setLoading(false);
            if (res.ok) { setOpen(false); onAdded?.(made.playlist_id); }
            else alert(res.error || "Failed to add");
        } else {
            setLoading(false);
            alert(made.error || "Failed to create playlist");
        }
    }

    const modal = (
        <div
            className="modal"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
                // close if clicking the dimmed overlay (not the card)
                if (e.target === e.currentTarget) setOpen(false);
            }}
        >
            <div className="modal-card">
                <div className="modal-header">
                    <h3>Add to Playlist</h3>
                    <button onClick={() => setOpen(false)} className="icon-close" aria-label="Close">×</button>
                </div>

                <div className="modal-body">
                    {playlists.length === 0 ? (
                        <p>No playlists yet. Create one below.</p>
                    ) : (
                        <ul className="list">
                            {playlists.map(p => (
                                <li key={p.id}>
                                    <button
                                        className="list-item"
                                        onClick={() => handleAdd(p.id)}
                                        disabled={loading}
                                    >
                                        {p.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="divider" />
                    <label className="field">
                        <span>New playlist name</span>
                        <input
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            maxLength={80}
                        />
                    </label>
                    <button
                        className="btn primary"
                        onClick={handleCreateAndAdd}
                        disabled={loading || !newName.trim()}
                    >
                        Create & Add
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="ab-add-to-pl">
            <button
                className="song-play-btn song-add-btn"
                onClick={() => setOpen(true)}
                disabled={loading}
                title="Add to playlist"
            >
                <span className="material-symbols-outlined">playlist_add</span>
            </button>

            {open ? createPortal(modal, document.body) : null}
        </div>
    );
}
