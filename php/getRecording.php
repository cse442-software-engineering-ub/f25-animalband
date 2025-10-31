<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// DB connection
$servername = "localhost";
$username = "ikimos";
$password = "50445468";
$dbname = "cse442_2025_fall_team_h_db";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "DB connection failed"]);
    exit;
}

// Validate params
if (!isset($_GET['id']) || !isset($_GET['email'])) {
    http_response_code(400);
    echo json_encode(["error" => "Missing parameters"]);
    exit;
}

$id = (int)$_GET['id'];
$email = $conn->real_escape_string($_GET['email']);

// Fetch recording info
$sql = "SELECT id, title, file_name, original_name 
        FROM localRecordings 
        WHERE id = $id AND email = '$email' LIMIT 1";
$result = $conn->query($sql);

if (!$result || $result->num_rows == 0) {
    http_response_code(404);
    echo json_encode(["error" => "Recording not found"]);
    exit;
}

$row = $result->fetch_assoc();
$recordingUrl = "uploads/recordings/" . $row['file_name']; // JSON file URL

echo json_encode([
    "recording" => [
        "id" => (int)$row['id'],
        "title" => $row['title'],
        "original_name" => $row['original_name'],
        "url" => $recordingUrl
    ]
]);

$conn->close();
exit;
?>
