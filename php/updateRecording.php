<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Database Config
$servername = "localhost";
$username = "ikimos";
$password = "50445468";
$dbname = "cse442_2025_fall_team_h_db";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

// Read Input JSON
$input = file_get_contents("php://input");
$data = json_decode($input, true);

if (!$data || !is_array($data)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

// Extract inputs
$auth_token = trim($data['userToken'] ?? '');
$recording_id = intval($data['recordingId'] ?? 0);
$title = trim($data['title'] ?? '');
$description = trim($data['description'] ?? '');
$recording = $data['recording'] ?? [];

if (empty($auth_token) || $recording_id <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

// Encode recording
$recordingJson = json_encode($recording, JSON_UNESCAPED_UNICODE);

// Authenticate User Token
$tokenStmt = $conn->prepare("SELECT Email FROM authTokens WHERE Token = ?");
if (!$tokenStmt) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
    exit;
}

$tokenStmt->bind_param("s", $auth_token);
$tokenStmt->execute();
$result = $tokenStmt->get_result();

if ($result && $result->num_rows > 0) {
    $row = $result->fetch_assoc();
    $email = $row['Email'];
} else {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid auth token']);
    $tokenStmt->close();
    $conn->close();
    exit;
}
$tokenStmt->close();

// Verify ownership of the recording
$checkStmt = $conn->prepare("SELECT id FROM localRecordings WHERE id = ? AND email = ?");
if (!$checkStmt) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
    $conn->close();
    exit;
}

$checkStmt->bind_param("is", $recording_id, $email);
$checkStmt->execute();
$checkResult = $checkStmt->get_result();

if ($checkResult->num_rows === 0) {
    http_response_code(403);
    echo json_encode(['error' => 'You do not have permission to edit this recording']);
    $checkStmt->close();
    $conn->close();
    exit;
}
$checkStmt->close();

// Update Recording - FIXED: changed "ssdis" to "sssis"
$updateStmt = $conn->prepare("
    UPDATE localRecordings 
    SET title = ?, description = ?, recording = ?
    WHERE id = ? AND email = ?
");

if (!$updateStmt) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
    $conn->close();
    exit;
}

// FIXED: Changed from "ssdis" to "sssis" - recording is a string, not a double
$updateStmt->bind_param("sssis", $title, $description, $recordingJson, $recording_id, $email);

if ($updateStmt->execute()) {
    echo json_encode([
        'success' => true,
        'message' => 'Recording updated successfully'
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to update recording'
    ]);
}

$updateStmt->close();
$conn->close();
?>