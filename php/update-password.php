<?php
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Headers: Content-Type");
    header("Content-Type: application/json");

// 1. Read input
$input = json_decode(file_get_contents("php://input"), true);

if (!isset($input['auth_token']) || !isset($input['new_password'])) {
    echo json_encode(["success" => false, "message" => "Missing required fields."]);
    exit;
}

$authToken = $input['auth_token'];
$newPassword = $input['new_password'];

// 2. Connect to DB
$servername = "localhost";
$username = "ikimos";  // your DB username
$password = "50445468";  // your DB password
$database = "cse442_2025_fall_team_h_db";

$conn = new mysqli($servername, $username, $password, $database);

if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Database connection failed."]);
    exit;
}

// 3. Get email from authTokens
$stmt = $conn->prepare("SELECT Email FROM authTokens WHERE Token = ?");
$stmt->bind_param("s", $authToken);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Invalid authentication token."]);
    $stmt->close();
    $conn->close();
    exit;
}

$row = $result->fetch_assoc();
$email = $row['Email'];
$stmt->close();

// 4. Hash the new password
$hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);

// 5. Update password in accountCredentials
$stmt = $conn->prepare("UPDATE accountCredentials SET Password = ? WHERE Email = ?");
$stmt->bind_param("ss", $hashedPassword, $email);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Password updated successfully."]);
} else {
    echo json_encode(["success" => false, "message" => "Failed to update password."]);
}

$stmt->close();
$conn->close();
?>
