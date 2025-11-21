<?php
session_start();
header('Content-Type: application/json');

// === DB CONFIG ===
$host = "localhost";
$db = "cse442_2025_fall_team_h_db";
$user = "ikimos";
$pass = "50445468";

// === Helper for HTML Escaping (for error messages) ===
function h($str) {
    return htmlspecialchars($str ?? '', ENT_QUOTES, 'UTF-8');
}

// === Validate Session Email ===
if (!isset($_SESSION['reset-email'])) {
    http_response_code(403);
    echo json_encode([
        "success" => false,
        "message" => "Session expired or invalid."
    ]);
    exit;
}

$email = $_SESSION['reset-email'];

// === Read JSON body ===
$rawInput = file_get_contents("php://input");
$data = json_decode($rawInput, true);

$newPassword = isset($data["new_password"]) ? trim($data["new_password"]) : "";

// === Validate New Password ===
if (empty($newPassword) || strlen($newPassword) < 8) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Password must be at least 8 characters long."
    ]);
    exit;
}

// === Hash the new password securely ===
$hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);

// === Connect to DB ===
$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database connection failed."
    ]);
    exit;
}

// === Update password in DB (SQL Injection Safe) ===
$stmt = $conn->prepare("UPDATE accountCredentials SET password = ? WHERE email = ?");
if (!$stmt) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Prepare failed: " . h($conn->error)
    ]);
    $conn->close();
    exit;
}

$stmt->bind_param("ss", $hashedPassword, $email);

if ($stmt->execute()) {
    // Clean up session
    unset($_SESSION['reset-email']);
    echo json_encode(["success" => true]);
} else {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to update password.",
        "details" => h($stmt->error)
    ]);
}

$stmt->close();
$conn->close();
?>