<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

// Handle CORS preflight
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
    echo json_encode(["error" => "Database connection failed"]);
    exit;
}

// === Auth & Input ===
require_once "_auth.php";
$user = require_user($conn);
$body = get_json_body();

$playlist_id = isset($body["playlist_id"]) ? (int) $body["playlist_id"] : 0;
if ($playlist_id <= 0) {
    http_response_code(400);
    echo json_encode(["error" => "Missing or invalid playlist_id"]);
    exit;
}

// === Verify Ownership ===
$stmt = $conn->prepare("SELECT 1 FROM playlists WHERE id = ? AND owner_id = ?");
$stmt->bind_param("ii", $playlist_id, $user["ID"]);
$stmt->execute();
if (!$stmt->get_result()->fetch_row()) {
    http_response_code(403);
    echo json_encode(["error" => "Not owner"]);
    exit;
}

// === Parse Fields ===
$name = isset($body["name"]) ? trim((string)$body["name"]) : null;
$is_public = $body["is_public"] ?? null;

// === Validate Input ===
if ($name !== null && $name === "") {
    http_response_code(400);
    echo json_encode(["error" => "Name cannot be empty"]);
    exit;
}

$updateFields = [];
$params = [];
$types = "";

// Build query dynamically
if ($name !== null) {
    $updateFields[] = "name = ?";
    $params[] = $name;
    $types .= "s";
}

if ($is_public !== null) {
    $updateFields[] = "is_public = ?";
    $params[] = (int) !!$is_public; // force 0 or 1
    $types .= "i";
}

// Nothing to update
if (empty($updateFields)) {
    echo json_encode(["ok" => true]);
    exit;
}

// === Execute Update ===
$sql = "UPDATE playlists SET " . implode(", ", $updateFields) . " WHERE id = ?";
$params[] = $playlist_id;
$types .= "i";

$stmt = $conn->prepare($sql);
$stmt->bind_param($types, ...$params);

$ok = $stmt->execute();
$stmt->close();
$conn->close();

echo json_encode(["ok" => $ok]);
?>
