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
$conn = new mysqli($servername, $username, $password, "cse442_2025_fall_team_h_db");

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed"]);
    exit;
}

$conn->set_charset("utf8mb4");

if (!isset($_COOKIE["auth_token"])) {
    echo json_encode(["loggedIn" => false]);
    $conn->close();
    exit;
}

$token = trim((string)$_COOKIE["auth_token"]);

if (empty($token)) {
    echo json_encode(["loggedIn" => false]);
    $conn->close();
    exit;
}

$stmt = $conn->prepare("SELECT accountCredentials.ID, accountCredentials.Name, accountCredentials.Email, accountCredentials.ProfilePic
                        FROM authTokens 
                        JOIN accountCredentials ON authTokens.Email = accountCredentials.Email
                        WHERE authTokens.Token = ?");

if (!$stmt) {
    http_response_code(500);
    echo json_encode(["error" => "Database query failed"]);
    $conn->close();
    exit;
}

$stmt->bind_param("s", $token);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    echo json_encode([
        "loggedIn" => true,
        "username" => htmlspecialchars($row["Name"], ENT_QUOTES, 'UTF-8'),
        "email" => htmlspecialchars($row["Email"], ENT_QUOTES, 'UTF-8'),
        "profilePic" => htmlspecialchars($row["ProfilePic"], ENT_QUOTES, 'UTF-8'),
        "id" => (int)$row["ID"]
    ], JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode(["loggedIn" => false]);
}

$stmt->close();
$conn->close();
?>