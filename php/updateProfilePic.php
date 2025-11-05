<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json");
session_start();

// === Database Configuration ===
$servername = "localhost";
$username = "ikimos";
$password = "50445468";
$dbname = "cse442_2025_fall_team_h_db";

// === Connect to Database ===
$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit;
}

// === Authenticate User via Cookie ===
if (empty($_COOKIE['auth_token'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Not logged in"]);
    exit;
}

$token = $_COOKIE['auth_token'];
$stmt = $conn->prepare("SELECT Email FROM authTokens WHERE Token = ?");
$stmt->bind_param("s", $token);
$stmt->execute();
$result = $stmt->get_result();
$stmt->close();

if ($result->num_rows === 0) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Invalid token"]);
    exit;
}

$user = $result->fetch_assoc();
$email = $user['Email'];

// === Handle File Upload ===
if (!isset($_FILES['profilePic']) || $_FILES['profilePic']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "No file uploaded or upload error"]);
    exit;
}

$file = $_FILES['profilePic'];

// === Validate File Type and Size ===
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
$maxFileSize = 5 * 1024 * 1024; // 5 MB

if (!in_array($file['type'], $allowedTypes)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid file type"]);
    exit;
}

if ($file['size'] > $maxFileSize) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "File too large"]);
    exit;
}

// === Create Upload Directory if Needed ===
$uploadDir = __DIR__ . "/uploads/";
if (!is_dir($uploadDir) && !mkdir($uploadDir, 0777, true)) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to create upload directory"]);
    exit;
}

// === Sanitize and Generate File Name ===
$ext = pathinfo($file['name'], PATHINFO_EXTENSION);
$fileName = time() . "_" . bin2hex(random_bytes(8)) . "." . $ext;
$filePath = $uploadDir . $fileName;
$dbPath = "uploads/" . $fileName;

// === Move Uploaded File ===
if (!move_uploaded_file($file['tmp_name'], $filePath)) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "File upload failed"]);
    exit;
}

// === Update Database ===
$update = $conn->prepare("UPDATE accountCredentials SET ProfilePic = ? WHERE Email = ?");
$update->bind_param("ss", $dbPath, $email);

if ($update->execute()) {
    echo json_encode(["success" => true, "profilePic" => $dbPath]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database update failed"]);
}

$update->close();
$conn->close();
?>