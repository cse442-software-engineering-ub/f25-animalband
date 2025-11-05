<?php
// Allow CORS (be careful in production — ideally restrict origins)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Database connection
$servername = "localhost";
$username = "ikimos";
$password = "50445468";
$dbname = "cse442_2025_fall_team_h_db";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed."]);
    exit;
}

// Include authentication helper
require_once "_auth.php";
$user = require_user($conn);
$body = get_json_body();

// Helper: HTML escape safely
function h($str) {
    return htmlspecialchars($str ?? '', ENT_QUOTES, 'UTF-8');
}

// Validate input
$playlist_id = isset($body["playlist_id"]) ? (int)$body["playlist_id"] : 0;
$song_id = isset($body["song_id"]) ? (int)$body["song_id"] : 0;

if ($playlist_id <= 0 || $song_id <= 0) {
    http_response_code(400);
    echo json_encode(["error" => "Missing or invalid fields"]);
    exit;
}

// Verify playlist ownership (prevents unauthorized manipulation)
$own = $conn->prepare("SELECT 1 FROM playlists WHERE id = ? AND owner_id = ?");
if (!$own) {
    http_response_code(500);
    echo json_encode(["error" => "Prepare failed"]);
    exit;
}
$own->bind_param("ii", $playlist_id, $user["ID"]);
$own->execute();
$res = $own->get_result();
if (!$res || !$res->fetch_row()) {
    http_response_code(403);
    echo json_encode(["error" => "Not owner"]);
    $own->close();
    exit;
}
$own->close();

// Delete song from playlist safely
$del = $conn->prepare("DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?");
if (!$del) {
    http_response_code(500);
    echo json_encode(["error" => "Prepare failed"]);
    exit;
}
$del->bind_param("ii", $playlist_id, $song_id);
$ok = $del->execute();
$del->close();

if (!$ok) {
    http_response_code(500);
    echo json_encode(["error" => "Delete failed: " . h($conn->error)]);
} else {
    echo json_encode(["ok" => true]);
}

$conn->close();
?>
