<?php
// === CORS Headers ===
header("Access-Control-Allow-Origin: *"); // In production, restrict to your domain
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// === Database Connection ===
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

// === Authentication ===
require_once "_auth.php";
$user = require_user($conn);
$body = get_json_body();

// === HTML Escape Helper ===
function h($str) {
    return htmlspecialchars($str ?? '', ENT_QUOTES, 'UTF-8');
}

// === Input Validation ===
$playlist_id = isset($body["playlist_id"]) ? (int)$body["playlist_id"] : 0;
$order = isset($body["order"]) && is_array($body["order"]) ? $body["order"] : [];

if ($playlist_id <= 0 || empty($order)) {
    http_response_code(400);
    echo json_encode(["error" => "Missing or invalid fields"]);
    exit;
}

// === Check Ownership Securely ===
$own = $conn->prepare("SELECT 1 FROM playlists WHERE id = ? AND owner_id = ?");
if (!$own) {
    http_response_code(500);
    echo json_encode(["error" => "Prepare failed."]);
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

// === Begin Transaction for Safety ===
$conn->begin_transaction();

try {
    $pos = 1;
    $upd = $conn->prepare("UPDATE playlist_songs SET position = ? WHERE playlist_id = ? AND song_id = ?");
    if (!$upd) {
        throw new Exception("Prepare failed: " . h($conn->error));
    }

    foreach ($order as $sid) {
        $sid = (int)$sid;
        if ($sid <= 0) continue; // skip invalid song IDs

        $upd->bind_param("iii", $pos, $playlist_id, $sid);
        if (!$upd->execute()) {
            throw new Exception("Update failed: " . h($upd->error));
        }
        $pos++;
    }

    $conn->commit();
    echo json_encode(["ok" => true]);

} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}

$conn->close();
?>
