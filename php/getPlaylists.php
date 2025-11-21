<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
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
    echo json_encode(["error" => "Database connection failed"]);
    exit;
}

$conn->set_charset("utf8mb4");

require_once "_auth.php";
$user = require_user($conn);

$stmt = $conn->prepare("SELECT id, name, is_public, created_at, updated_at FROM playlists WHERE owner_id=? ORDER BY updated_at DESC");

if (!$stmt) {
    http_response_code(500);
    echo json_encode(["error" => "Database query failed"]);
    $conn->close();
    exit;
}

$stmt->bind_param("i", $user["ID"]);
$stmt->execute();
$res = $stmt->get_result();

$out = [];
while ($r = $res->fetch_assoc()) {
    $out[] = [
        "id" => (int)$r["id"],
        "name" => htmlspecialchars($r["name"], ENT_QUOTES, 'UTF-8'),
        "is_public" => (int)$r["is_public"],
        "created_at" => htmlspecialchars($r["created_at"], ENT_QUOTES, 'UTF-8'),
        "updated_at" => htmlspecialchars($r["updated_at"], ENT_QUOTES, 'UTF-8')
    ];
}

echo json_encode(["ok" => true, "playlists" => $out], JSON_UNESCAPED_UNICODE);

$stmt->close();
$conn->close();
?>