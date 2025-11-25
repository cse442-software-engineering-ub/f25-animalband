//desktop version
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  getMyPlaylists,
  addSongToPlaylist,
  createPlaylist,
} from "../api/playlists.js";
import "./desktop_add_to_playlist_button.css";

export default function AddToPlaylistButton({
  songId,
  compact = false,
  onAdded,
  requireLogin = true,
  user = null,
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");

  // auth gate (optional)
  const ensureAuthed = () => {
    if (requireLogin && !user) {
      navigate("/login");
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        setError("");
        const res = await getMyPlaylists();
        if (res.ok) setPlaylists(res.playlists || []);
        else setError(res.error || "Failed to load playlists");
      } catch (e) {
        console.error(e);
        setError("Failed to load playlists");
      }
    })();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function handleAdd(pid) {
    if (!ensureAuthed()) return;
    console.log("Adding", { playlist_id: pid, song_id: songId });

    try {
      setLoading(true);
      const res = await addSongToPlaylist(pid, songId);
      setLoading(false);
      if (res.ok) {
        onAdded?.(pid);
        setOpen(false);
      } else {
        setError(res.error || "Failed to add to playlist");
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
      setError("Failed to add to playlist");
    }
  }

  async function handleCreateAndAdd() {
    if (!ensureAuthed()) return;
    const name = newName.trim();
    if (!name) return;
    try {
      setLoading(true);
      setError("");
      const made = await createPlaylist({ name, is_public: false });
      if (!made.ok) {
        setLoading(false);
        setError(made.error || "Failed to create playlist");
        return;
      }
      const res = await addSongToPlaylist(made.playlist_id, songId);
      setLoading(false);
      if (res.ok) {
        onAdded?.(made.playlist_id);
        setOpen(false);
      } else {
        setError(res.error || "Failed to add to new playlist");
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
      setError("Failed to create or add");
    }
  }

  const modal = (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="modal-card">
        <div className="modal-header">
          <h3>Add to Playlist</h3>
          <button
            onClick={() => setOpen(false)}
            className="icon-close"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}

          {playlists.length === 0 ? (
            <p>No playlists yet. Create one below.</p>
          ) : (
            <ul className="list">
              {playlists.map((p) => (
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
              onChange={(e) => setNewName(e.target.value)}
              maxLength={80}
              placeholder="e.g., Roadtrip Vibes"
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
        onClick={() => {
          if (!ensureAuthed()) return;
          setOpen(true);
        }}
        disabled={loading}
        title="Add to playlist"
        aria-label="Add to playlist"
      >
        <span className="material-symbols-outlined">playlist_add</span>
      </button>

      {open ? createPortal(modal, document.body) : null}
    </div>
  );
}