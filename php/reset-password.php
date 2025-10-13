<?php
session_start();

header('Content-Type: application/json');

// === CONFIG ===
$host = "localhost";
$db = "cse442_2025_fall_team_h_db";
$user = "ikimos";
$pass = "50445468";

// === Read and Validate Input ===
$data = json_decode(file_get_contents("php://input"), true);
$code = isset($data["verification_code"]) ? trim($data["verification_code"]) : "";

// Simple validation
if (!preg_match('/^\d{6}$/', $code)) {
    echo json_encode(["success" => false, "error" => "Malformed verification code"]);
    exit;
}

// === Connect to Database ===
$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    echo json_encode(["success" => false, "error" => "Error connecting to database"]);
    exit;
}

// === Check if code exists in verificationCodes table ===
$stmt = $conn->prepare("SELECT email FROM verificationCodes WHERE code = ?");
$stmt->bind_param("s", $code);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    // Invalid code
    echo json_encode(["success" => false, "error" => "Invalid verification code"]);
    $stmt->close();
    $conn->close();
    exit;
}

$row = $result->fetch_assoc();
$email = $row["email"];
$stmt->close();

$_SESSION['reset-email'] = $email;

// === Respond success ===
echo json_encode(["success" => true]);
$conn->close();
?>
