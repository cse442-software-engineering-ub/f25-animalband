<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
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

// Read input JSON (if you send via POST)
$input = file_get_contents("php://input");
$data = json_decode($input, true);
if (!is_array($data)) $data = [];

// Try to get auth token either from JSON body or from cookie
$auth_token = "";
if (isset($data["auth_token"])) {
    $auth_token = trim((string)$data["auth_token"]);
} else if (isset($_COOKIE["auth_token"])) {
    $auth_token = trim((string)$_COOKIE["auth_token"]);
}

if (empty($auth_token)) {
    http_response_code(401);
    echo json_encode(["error" => "Missing auth token"]);
    exit;
}

// Lookup the email for that token (use prepared statement)
$tokenLookupSQL = "SELECT Email FROM authTokens WHERE Token = ?";
$tokenStmt = $conn->prepare($tokenLookupSQL);

if (!$tokenStmt) {
    http_response_code(500);
    echo json_encode(["error" => "Database query failed"]);
    exit;
}

$tokenStmt->bind_param("s", $auth_token);
$tokenStmt->execute();
$result = $tokenStmt->get_result();

if (!$result || $result->num_rows === 0) {
    http_response_code(401);
    echo json_encode(["error" => "Invalid auth token"]);
    $tokenStmt->close();
    $conn->close();
    exit;
}

$row = $result->fetch_assoc();
$email = $row["Email"];
$tokenStmt->close();

// Fetch all recordings for that email
$fetchSQL = "SELECT id, title, description, recording FROM localRecordings WHERE email = ?";
$fetchStmt = $conn->prepare($fetchSQL);

if (!$fetchStmt) {
    http_response_code(500);
    echo json_encode(["error" => "Database query failed"]);
    $conn->close();
    exit;
}

$fetchStmt->bind_param("s", $email);
$fetchStmt->execute();
$fetchResult = $fetchStmt->get_result();

$recordings = [];
while ($rec = $fetchResult->fetch_assoc()) {
    // Decode recording JSON
    $recordingData = json_decode($rec["recording"], true);
    if (!is_array($recordingData)) $recordingData = [];
    
    $recordings[] = [
        "id" => (int)$rec["id"],
        "title" => htmlspecialchars($rec["title"], ENT_QUOTES, 'UTF-8'),
        "description" => htmlspecialchars($rec["description"], ENT_QUOTES, 'UTF-8'),
        "recording" => $recordingData,
    ];
}

echo json_encode([
    "success" => true,
    "recordings" => $recordings
], JSON_UNESCAPED_UNICODE);

// close connections
$fetchStmt->close();
$conn->close();
?>