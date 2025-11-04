<?php
session_start();

header('Content-Type: application/json');

// === CONFIG ===
$host = "localhost";
$db = "cse442_2025_fall_team_h_db";
$user = "ikimos";
$pass = "50445468";

// === Helper for HTML Escaping ===
function h($str) {
    return htmlspecialchars($str ?? '', ENT_QUOTES, 'UTF-8');
}

// === Read and Validate Input ===
$raw = file_get_contents("php://input");
$data = json_decode($raw, true);

$code = isset($data["verification_code"]) ? trim($data["verification_code"]) : "";

// Validate: must be exactly 6 digits
if (!preg_match('/^\d{6}$/', $code)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "error" => "Malformed verification code"
    ]);
    exit;
}

// === Connect to Database ===
$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Database connection failed"
    ]);
    exit;
}

// === Secure Query (SQL Injection Safe) ===
$stmt = $conn->prepare("SELECT email FROM verificationCodes WHERE code = ?");
if (!$stmt) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Prepare failed: " . h($conn->error)
    ]);
    $conn->close();
    exit;
}

$stmt->bind_param("s", $code);
$stmt->execute();
$result = $stmt->get_result();

// === Verify Code Existence ===
if (!$result || $result->num_rows === 0) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "error" => "Invalid or expired verification code"
    ]);
    $stmt->close();
    $conn->close();
    exit;
}

$row = $result->fetch_assoc();
$email = $row["email"];
$stmt->close();

// Store safely in session (server-side)
$_SESSION['reset-email'] = $email;

// === Respond Success ===
echo json_encode(["success" => true]);

$conn->close();
?>
