<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json");
session_start();

$servername = "localhost";
$username = "ikimos";
$password = "50445468";
$dbname = "cse442_2025_fall_team_h_db";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit();
}

// Get auth_token cookie
if (!isset($_COOKIE['auth_token'])) {
    echo json_encode(["success" => false, "message" => "Not logged in"]);
    exit();
}

$token = $_COOKIE['auth_token'];
$stmt = $conn->prepare("SELECT Email FROM authTokens WHERE Token=?");
$stmt->bind_param("s", $token);
$stmt->execute();
$result = $stmt->get_result();
if ($result->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Invalid token"]);
    exit();
}
$user = $result->fetch_assoc();
$email = $user['Email'];

// Handle file upload
if (isset($_FILES['profilePic']) && $_FILES['profilePic']['error'] === UPLOAD_ERR_OK) {
    $uploadDir = __DIR__ . "/uploads/";
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $fileName = time() . "_" . basename($_FILES['profilePic']['name']);
    $filePath = $uploadDir . $fileName;
    $dbPath = "uploads/" . $fileName;

    if (move_uploaded_file($_FILES['profilePic']['tmp_name'], $filePath)) {
        // Update DB
        $update = $conn->prepare("UPDATE accountCredentials SET ProfilePic=? WHERE Email=?");
        $update->bind_param("ss", $dbPath, $email);
        if ($update->execute()) {
            echo json_encode(["success" => true, "profilePic" => $dbPath]);
        } else {
            echo json_encode(["success" => false, "message" => "DB update failed"]);
        }
        $update->close();
    } else {
        echo json_encode(["success" => false, "message" => "File upload failed"]);
    }
} else {
    echo json_encode(["success" => false, "message" => "No file uploaded"]);
}

$conn->close();
?>