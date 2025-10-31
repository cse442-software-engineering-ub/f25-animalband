<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$servername = "localhost";
$username = "ikimos";
$password = "50445468";
$dbname = "cse442_2025_fall_team_h_db";
$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "db"]);
    exit;
}

require_once "_auth.php";
$user = require_user($conn);
$body = get_json_body();

$playlist_id = (int) ($body["playlist_id"] ?? 0);
$song_id = (int) ($body["song_id"] ?? 0);
if (!$playlist_id || !$song_id) {
    http_response_code(400);
    echo json_encode(["error" => "Missing fields"]);
    exit;
}

$own = $conn->prepare("SELECT 1 FROM playlists WHERE id=? AND owner_id=?");
$own->bind_param("ii", $playlist_id, $user["ID"]);
$own->execute();
if (!$own->get_result()->fetch_row()) {
    http_response_code(403);
    echo json_encode(["error" => "Not owner"]);
    exit;
}

$exists = $conn->prepare("SELECT 1 FROM localRecordings WHERE id=?");
$exists->bind_param("i", $song_id);
$exists->execute();
if (!$exists->get_result()->fetch_row()) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid song_id"]);
    exit;
}

$chk = $conn->prepare("SELECT 1 FROM playlist_songs WHERE playlist_id=? AND song_id=?");
$chk->bind_param("ii", $playlist_id, $song_id);
$chk->execute();
if ($chk->get_result()->fetch_row()) {
    echo json_encode(["ok" => true, "skipped" => true]);
    exit;
}

$maxq = $conn->prepare("SELECT COALESCE(MAX(position),0)+1 AS nextpos FROM playlist_songs WHERE playlist_id=?");
$maxq->bind_param("i", $playlist_id);
$maxq->execute();
$nextpos = (int) $maxq->get_result()->fetch_assoc()["nextpos"];

$ins = $conn->prepare("INSERT INTO playlist_songs (playlist_id, song_id, position) VALUES (?,?,?)");
$ins->bind_param("iii", $playlist_id, $song_id, $nextpos);
$ok = $ins->execute();

if (!$ok) {
    http_response_code(500);
    echo json_encode(["error" => "Insert failed"]);
    exit;
}

echo json_encode(["ok" => true, "position" => $nextpos]);