<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, OPTIONS");
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

$stmt = $conn->prepare("SELECT id, name, is_public, created_at, updated_at FROM playlists WHERE owner_id=? ORDER BY updated_at DESC");
$stmt->bind_param("i", $user["ID"]);
$stmt->execute();
$res = $stmt->get_result();
$out = [];
while ($r = $res->fetch_assoc())
    $out[] = $r;

echo json_encode(["ok" => true, "playlists" => $out]);
