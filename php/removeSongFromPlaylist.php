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

$del = $conn->prepare("DELETE FROM playlist_songs WHERE playlist_id=? AND song_id=?");
$del->bind_param("ii", $playlist_id, $song_id);
$ok = $del->execute();

echo json_encode(["ok" => $ok]);
