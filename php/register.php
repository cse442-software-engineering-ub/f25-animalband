<?php
// Allow cross-origin requests
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$servername = "localhost";
$username = "ikimos";
$password = "50445468";

$conn = new mysqli($servername, $username, $password, "cse442_2025_fall_team_h_db");

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Ensure tables exist
$conn->query("CREATE TABLE IF NOT EXISTS authTokens (
    Email VARCHAR(50),
    Token VARCHAR(255)
)");

$conn->query("CREATE TABLE IF NOT EXISTS accountCredentials (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(50),
    Email VARCHAR(50),
    Password VARCHAR(255),
    ProfilePic VARCHAR(255)
)");

// Grab POST fields
$username = $_POST['username'] ?? null;
$email = $_POST['email'] ?? null;
$password = $_POST['password'] ?? null;

// Default
$profilePicPath = "uploads/bird.jpeg";
// Handle file upload
if (isset($_FILES['profilePic']) && $_FILES['profilePic']['error'] === UPLOAD_ERR_OK) {
    $uploadDir = "/data/web/CSE442/2025-Fall/cse-442h/php/uploads/";
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $fileTmpPath = $_FILES['profilePic']['tmp_name'];
    $fileName = uniqid() . "_" . basename($_FILES['profilePic']['name']);
    $destPath = $uploadDir . $fileName;

    if (move_uploaded_file($fileTmpPath, $destPath)) {
        $profilePicPath = "uploads/" . $fileName; // relative path stored in DB
    } else {
        error_log("File upload failed: tmp=$fileTmpPath dest=$destPath");
    }
} else {
    if (isset($_FILES['profilePic'])) {
        error_log("Upload error code: " . $_FILES['profilePic']['error']);
    } else {
        error_log("No profilePic file received using default");
        $profilePicPath = "uploads/bird.jpeg";
    }
}

// Insert user
if ($username && $email && $password) {
    $hashedPwd = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $conn->prepare("INSERT INTO accountCredentials (Name, Email, Password, ProfilePic) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $username, $email, $hashedPwd, $profilePicPath);

    if ($stmt->execute()) {
        echo json_encode(['message' => 'User registered successfully']);
    } else {
        echo json_encode(['message' => 'Error inserting user: ' . $stmt->error]);
    }
    $stmt->close();

    // Generate token
    $token = bin2hex(random_bytes(32));
    $stmt = $conn->prepare("INSERT INTO authTokens (Email, Token) VALUES (?, ?)");
    $stmt->bind_param("ss", $email, $token);
    $stmt->execute();
    $stmt->close();

    setcookie("auth_token", $token, [
        'expires' => time() + 3600,
        'path' => '/',
        'secure' => true,
        'httponly' => false,
        'samesite' => 'Strict',
    ]);
} else {
    echo json_encode(['message' => 'Missing required fields']);
}

$conn->close();
?>