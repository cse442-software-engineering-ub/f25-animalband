<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

$servername = "localhost";
$username = "ikimos";
$password = "50445468";
$dbname = "cse442_2025_fall_team_h_db";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["message" => "Database connection failed"]);
    exit;
}

// Check token from cookie
if (!isset($_COOKIE["auth_token"])) {
    http_response_code(401);
    echo json_encode(["message" => "Not authenticated"]);
    exit;
}

$token = $_COOKIE["auth_token"];

// Find the user by token
$stmt = $conn->prepare("SELECT Email FROM authTokens WHERE Token = ?");
$stmt->bind_param("s", $token);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    $email = $row["Email"];

    // Delete user records from both tables
    $deleteUser = $conn->prepare("DELETE FROM accountCredentials WHERE Email = ?");
    $deleteUser->bind_param("s", $email);
    $deleteUser->execute();

    $deleteToken = $conn->prepare("DELETE FROM authTokens WHERE Email = ?");
    $deleteToken->bind_param("s", $email);
    $deleteToken->execute();

    // Clear cookie
    setcookie("auth_token", "", time() - 3600, "/", "", true, true);

    echo json_encode(["message" => "Account deleted successfully"]);
} else {
    http_response_code(400);
    echo json_encode(["message" => "Invalid or expired token"]);
}

$stmt->close();
$conn->close();
?>
