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
    echo json_encode(["error" => "Database connection failed"]);
    exit;
}

$conn->set_charset("utf8mb4");

// Use prepared statement for consistency
$stmt = $conn->prepare("SELECT COUNT(*) AS count FROM accountCredentials");

if (!$stmt) {
    http_response_code(500);
    echo json_encode(["error" => "Database query failed"]);
    $conn->close();
    exit;
}

$stmt->execute();
$result = $stmt->get_result();

if ($result) {
    $row = $result->fetch_assoc();
    echo json_encode(["memberCount" => intval($row["count"])]);
} else {
    http_response_code(500);
    echo json_encode(["error" => "Failed to get member count"]);
}

$stmt->close();
$conn->close();
?>