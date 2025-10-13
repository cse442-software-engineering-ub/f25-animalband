<?php
session_start();
header('Content-Type: application/json');

// === DB CONFIG ===
$host = "localhost";
$db = "cse442_2025_fall_team_h_db";
$user = "ikimos";
$pass = "50445468";

// === Validate Session Email ===
if (!isset($_SESSION['reset-email'])) {
    echo json_encode(["success" => false, "message" => "Session expired or invalid."]);
    exit;
}

$email = $_SESSION['reset-email'];

// === Read JSON body ===
$data = json_decode(file_get_contents("php://input"), true);
$password = isset($data["new_password"]) ? $data["new_password"] : "";

// === Hash the new password ===
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

// === Connect to DB ===
$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Database connection failed."]);
    exit;
}

// === Update password in DB ===
$stmt = $conn->prepare("UPDATE accountCredentials SET password = ? WHERE email = ?");
$stmt->bind_param("ss", $hashedPassword, $email);

if ($stmt->execute()) {
    // Optionally: clean up session
    unset($_SESSION['reset-email']);
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["success" => false, "message" => "Failed to update password."]);
}

$stmt->close();
$conn->close();
?>
