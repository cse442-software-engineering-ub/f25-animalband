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

if (isset($_COOKIE['auth_token'])) {
    $token = $_COOKIE['auth_token'];

    // Delete token from database
    $stmt = $conn->prepare("DELETE FROM authTokens WHERE Token = ?");
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $stmt->close();

    // Remove cookie
    setcookie("auth_token", "", time() - 3600, "/", "", true, false);
}

echo json_encode(["success" => true, "message" => "Logged out successfully"]);
?>
