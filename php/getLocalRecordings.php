<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

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

// Read input JSON (if you send via POST)
$input = file_get_contents("php://input");
$data = json_decode($input, true);

// Try to get auth token either from JSON body or from cookie
$auth_token = "";
if (isset($data["auth_token"])) {
    $auth_token = $data["auth_token"];
} else if (isset($_COOKIE["auth_token"])) {
    $auth_token = $_COOKIE["auth_token"];
}

if (empty($auth_token)) {
    http_response_code(401);
    echo json_encode(["error" => "Missing auth token"]);
    exit;
}

// Lookup the email for that token (use prepared statement)
$tokenLookupSQL = "SELECT Email FROM authTokens WHERE Token = ?";
$tokenStmt = $conn->prepare($tokenLookupSQL);
$tokenStmt->bind_param("s", $auth_token);
$tokenStmt->execute();
$result = $tokenStmt->get_result();

if (!$result || $result->num_rows === 0) {
    http_response_code(401);
    echo json_encode(["error" => "Invalid auth token"]);
    exit;
}

$row = $result->fetch_assoc();
$email = $row["Email"];

// Fetch all recordings for that email
$fetchSQL = "SELECT id, title, description, recording FROM localRecordings WHERE email = ?";
$fetchStmt = $conn->prepare($fetchSQL);
$fetchStmt->bind_param("s", $email);
$fetchStmt->execute();
$fetchResult = $fetchStmt->get_result();

$recordings = [];
while ($rec = $fetchResult->fetch_assoc()) {
    // $rec["recording"] is a JSON string — decode to native array/object
    $recordings[] = [
        "id" => $rec["id"],
        "title" => $rec["title"],
        "description" => $rec["description"],
        "recording" => json_decode($rec["recording"], true),
    ];
}

echo json_encode([
    "success" => true,
    "recordings" => $recordings
]);

// close connections
$fetchStmt->close();
$tokenStmt->close();
$conn->close();
?>
