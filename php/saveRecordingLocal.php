<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$servername = "localhost";
$username = "ikimos";
$password = "50445468";

$conn = new mysqli($servername, $username, $password, "cse442_2025_fall_team_h_db");

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$createTableSQL = "
CREATE TABLE IF NOT EXISTS localRecordings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255),
    title VARCHAR(255),
    description TEXT,
    recording JSON
);
";

$conn->query($createTableSQL);

$input = file_get_contents("php://input");
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

$auth_token = $data['userToken'] ?? '';
$title = $data['title'] ?? '';
$description = $data['description'] ?? '';
$recordingJson = json_encode($data['recording'] ?? []);

$tokenLookupSQL = "SELECT Email FROM authTokens WHERE Token = '$auth_token'";
$result = $conn->query($tokenLookupSQL);

if ($result && $result->num_rows > 0) {
    $row = $result->fetch_assoc();
    $email = $conn->real_escape_string($row['email']);
} else {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid or missing auth token']);
    exit;
}

$insertSQL = "
    INSERT INTO localRecordings (email, title, description, recording)
    VALUES (?, ?, ?, ?)
";
$insertStmt = $conn->prepare($insertSQL);
$insertStmt->bind_param("ssss", $email, $title, $description, $recordingJson);


if ($insertStmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Recording saved successfully']);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save recording']);
}

$insertStmt->close();
$conn->close();

?>