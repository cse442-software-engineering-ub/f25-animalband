<?php
header('Content-Type: application/json');

// === CONFIG ===
$host = "localhost";
$db = "cse442_2025_fall_team_h_db";
$user = "ikimos";
$pass = "50445468";

// === Read JSON POST ===
$data = json_decode(file_get_contents("php://input"), true);
$email = isset($data["email"]) ? trim($data["email"]) : "";

// === Validate Email ===
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["success" => false, "error" => "Improperly formed email"]);
    exit;
}

// === Connect to Database ===
$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    echo json_encode(["success" => false, "error" => "Database connection error"]);
    exit;
}

// === Check if email exists in accountCredentials ===
$stmt = $conn->prepare("SELECT 1 FROM accountCredentials WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["success" => false, "error" => "Email not associated with any account"]);
    $stmt->close();
    $conn->close();
    exit;
}
$stmt->close();

// === Generate 6-digit code ===
$code = rand(100000, 999999);

// === Send Email ===
$subject = "Your AnimalBand Verification Code";
$message = "Your password reset code is: $code";
$headers = "From: no-reply@animalband.com";

if (!mail($email, $subject, $message, $headers)) {
    echo json_encode(["success" => false, "error" => "Failed to send email"]);
    $conn->close();
    exit;
}

// === Create verificationCodes table if it doesn't exist ===
$conn->query("
    CREATE TABLE IF NOT EXISTS verificationCodes (
        email VARCHAR(255) NOT NULL UNIQUE,
        code VARCHAR(6) NOT NULL    
    )
");

// === Store code in verificationCodes table ===
$insertStmt = $conn->prepare("
    INSERT INTO verificationCodes (email, code)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE code = VALUES(code)
");
$insertStmt->bind_param("ss", $email, $code);
$insertStmt->execute();
$insertStmt->close();

$conn->close();

// === Success ===
echo json_encode(["success" => true]);
?>
