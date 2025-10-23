<?php
// Allow cross-origin requests
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");

$servername = "localhost";
$username = "ikimos";
$password = "50445468";
$dbname = "cse442_2025_fall_team_h_db";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}

// Ensure the localRecordings table exists
$conn->query("CREATE TABLE IF NOT EXISTS localRecordings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userEmail VARCHAR(100),
    title VARCHAR(255),
    filePath VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

$result = $conn->query("SELECT COUNT(*) AS count FROM localRecordings");

if ($result) {
    $row = $result->fetch_assoc();
    echo json_encode(["loopCount" => intval($row["count"])]);
} else {
    echo json_encode(["error" => "Failed to get loop count"]);
}

$conn->close();
?>
