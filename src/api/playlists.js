const PHP_URL = "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php";

export async function getMyPlaylists() {
  const r = await fetch(`${PHP_URL}/getPlaylists.php`, { credentials: "include" });
  return r.json();
}

export async function createPlaylist({ name, is_public = false }) {
  const r = await fetch(`${PHP_URL}/createPlaylist.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name, is_public })
  });
  return r.json();
}

export async function updatePlaylist({ playlist_id, name, is_public }) {
  const r = await fetch(`${PHP_URL}/updatePlaylist.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ playlist_id, name, is_public })
  });
  return r.json();
}

export async function deletePlaylist(playlist_id) {
  const r = await fetch(`${PHP_URL}/deletePlaylist.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ playlist_id })
  });
  return r.json();
}

export async function getPlaylistTracks(playlist_id) {
  const r = await fetch(`${PHP_URL}/getPlaylistTracks.php?playlist_id=${playlist_id}`, {
    credentials: "include",
  });
  return r.json();
}

export async function addSongToPlaylist(playlist_id, song_id) {
  const r = await fetch(`${PHP_URL}/addSongToPlaylist.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ playlist_id, song_id })
  });
  return r.json();
}

export async function removeSongFromPlaylist(playlist_id, song_id) {
  const r = await fetch(`${PHP_URL}/removeSongFromPlaylist.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ playlist_id, song_id })
  });
  return r.json();
}

export async function reorderPlaylist(playlist_id, order) {
  const r = await fetch(`${PHP_URL}/reorderPlaylist.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ playlist_id, order })
  });
  return r.json();
}
