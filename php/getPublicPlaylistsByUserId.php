<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

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
    echo json_encode(["success" => false, "error" => "Database connection failed"]);
    exit;
}

$conn->set_charset("utf8mb4");

if (!isset($_GET['id'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Missing id"]);
    exit;
}

$userId = (int) $_GET['id'];
if ($userId <= 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Invalid id"]);
    exit;
}

// Fetch public playlists
$stmt = $conn->prepare("
    SELECT id, name
    FROM playlists
    WHERE owner_id = ? AND is_public = 1
");

$stmt->bind_param("i", $userId);
$stmt->execute();
$res = $stmt->get_result();

$playlists = [];

while ($row = $res->fetch_assoc()) {

    // Fetch song count for each playlist
    $pid = (int) $row["id"];
    $stmt2 = $conn->prepare("SELECT COUNT(*) AS cnt FROM playlist_songs WHERE playlist_id = ?");
    $stmt2->bind_param("i", $pid);
    $stmt2->execute();
    $cntRes = $stmt2->get_result()->fetch_assoc();
    $songCount = (int) ($cntRes["cnt"] ?? 0);
    $stmt2->close();

    $playlists[] = [
        "id" => $pid,
        "name" => $row["name"],
        "songCount" => $songCount
    ];
}

$stmt->close();
$conn->close();

echo json_encode(["success" => true, "playlists" => $playlists]);
?>