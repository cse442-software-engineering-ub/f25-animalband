// src/routes/playlists/mobile_add_to_playlist_button.js
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  getMyPlaylists,
  addSongToPlaylist,
  createPlaylist,
} from "../api/playlists.js";
import "./mobile_add_to_playlist_button.css";

export default function MobileAddToPlaylistButton({
  songId,
  compact = true,
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

  // lock body scroll while modal open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function handleAdd(pid) {
    if (!ensureAuthed()) return;
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

  const trigger = (
    <button
      className={`m-addpl-trigger ${compact ? "compact" : ""}`}
      title="Add to playlist"
      onClick={() => {
        if (!ensureAuthed()) return;
        setOpen(true);
      }}
      disabled={loading}
    >
      <span className="material-symbols-outlined">playlist_add</span>
      {!compact && <span>Add</span>}
    </button>
  );

  const modal = open ? (
    <div
      className="m-addpl-overlay"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="m-addpl-sheet" role="document">
        <div className="m-addpl-header">
          <h3>Add to Playlist</h3>
          <button
            className="m-addpl-close"
            aria-label="Close"
            onClick={() => setOpen(false)}
          >
            ×
          </button>
        </div>

        <div className="m-addpl-body">
          {error && <div className="m-addpl-error">{error}</div>}

          {playlists.length > 0 ? (
            <ul className="m-addpl-list">
              {playlists.map((p) => (
                <li key={p.id}>
                  <button
                    className="m-addpl-item"
                    onClick={() => handleAdd(p.id)}
                    disabled={loading}
                  >
                    <span className="material-symbols-outlined">queue_music</span>
                    <span className="m-addpl-name">{p.name}</span>
                    {p.is_public ? (
                      <span className="m-addpl-badge">Public</span>
                    ) : (
                      <span className="m-addpl-badge dim">Private</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-addpl-empty">No playlists yet. Create one below.</p>
          )}

          <div className="m-addpl-divider" />

          <label className="m-addpl-field">
            <span>New playlist name</span>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={80}
              placeholder="e.g., Roadtrip Vibes"
            />
          </label>

          <button
            className="m-addpl-primary"
            onClick={handleCreateAndAdd}
            disabled={loading || !newName.trim()}
          >
            Create & Add
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="m-addpl">
      {trigger}
      {open ? createPortal(modal, document.body) : null}
    </div>
  );
}
