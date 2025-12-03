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
$conn = new mysqli($servername, $username, $password, "cse442_2025_fall_team_h_db");

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit;
}

$conn->set_charset("utf8mb4");

if (isset($_COOKIE['auth_token'])) {
    $token = trim((string)$_COOKIE['auth_token']);
    
    if (!empty($token)) {
        // Delete token from database
        $stmt = $conn->prepare("DELETE FROM authTokens WHERE Token = ?");
        
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Logout failed"]);
            $conn->close();
            exit;
        }
        
        $stmt->bind_param("s", $token);
        $stmt->execute();
        $stmt->close();
    }
    
    // Remove cookie - CRITICAL: httponly must match the login cookie setting
    setcookie("auth_token", "", [
        'expires' => time() - 3600,
        'path' => '/',
        'secure' => true,
        'httponly' => false,  // Changed from false to true to match login
        'samesite' => 'Strict'
    ]);
}

echo json_encode(["success" => true, "message" => "Logged out successfully"]);

$conn->close();
?>