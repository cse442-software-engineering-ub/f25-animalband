<?php
// Allow cross-origin requests
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");

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

// Ensure the localRecordings table exists
$conn->query("CREATE TABLE IF NOT EXISTS localRecordings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userEmail VARCHAR(100),
    title VARCHAR(255),
    filePath VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

// Use prepared statement for consistency
$stmt = $conn->prepare("SELECT COUNT(*) AS count FROM localRecordings");

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
    echo json_encode(["loopCount" => intval($row["count"])]);
} else {
    http_response_code(500);
    echo json_encode(["error" => "Failed to get loop count"]);
}

$stmt->close();
$conn->close();
?>