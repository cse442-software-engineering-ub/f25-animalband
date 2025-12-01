<?php
// Allow cross-origin requests (be careful in production)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$servername = "localhost";
$username = "ikimos";
$password = "50445468";

$conn = new mysqli($servername, $username, $password, "cse442_2025_fall_team_h_db");
if ($conn->connect_error) {
    die(json_encode(["message" => "Database connection failed."]));
}

// Ensure tables exist (safe: no user input)
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

// Grab and sanitize POST fields
function sanitize_input($data) {
    return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
}

$username = isset($_POST['username']) ? sanitize_input($_POST['username']) : null;
$email = isset($_POST['email']) ? sanitize_input($_POST['email']) : null;
$password = isset($_POST['password']) ? $_POST['password'] : null; // not escaped before hashing

// Default profile picture
$profilePicPath = "uploads/bird.jpeg";

// Handle file upload securely
if (isset($_FILES['profilePic']) && $_FILES['profilePic']['error'] === UPLOAD_ERR_OK) {
    $uploadDir = "/data/web/CSE442/2025-Fall/cse-442h/php/uploads/";
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    // Use basename and unique prefix to prevent directory traversal
    $fileTmpPath = $_FILES['profilePic']['tmp_name'];
    $fileName = uniqid("", true) . "_" . basename($_FILES['profilePic']['name']);
    $fileName = preg_replace("/[^A-Za-z0-9_\.-]/", "_", $fileName); // sanitize filename
    $destPath = $uploadDir . $fileName;

    if (move_uploaded_file($fileTmpPath, $destPath)) {
        $profilePicPath = "uploads/" . $fileName;
    } else {
        error_log("File upload failed: tmp=$fileTmpPath dest=$destPath");
    }
} else {
    if (isset($_FILES['profilePic'])) {
        error_log("Upload error code: " . $_FILES['profilePic']['error']);
    } else {
        error_log("No profilePic file received using default");
    }
}

// Insert user securely
if ($username && $email && $password) {
    $hashedPwd = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $conn->prepare("INSERT INTO accountCredentials (Name, Email, Password, ProfilePic) VALUES (?, ?, ?, ?)");
    if (!$stmt) {
        echo json_encode(['message' => 'Database prepare error.']);
        exit;
    }

    $stmt->bind_param("ssss", $username, $email, $hashedPwd, $profilePicPath);

    if ($stmt->execute()) {
        echo json_encode(['message' => 'User registered successfully']);
    } else {
        echo json_encode(['message' => 'Error inserting user: ' . htmlspecialchars($stmt->error, ENT_QUOTES, 'UTF-8')]);
    }
    $stmt->close();

    // Generate secure token
    $token = bin2hex(random_bytes(32));
    $stmt = $conn->prepare("INSERT INTO authTokens (Email, Token) VALUES (?, ?)");
    if ($stmt) {
        $stmt->bind_param("ss", $email, $token);
        $stmt->execute();
        $stmt->close();
    }

    // Set secure cookie
    setcookie("auth_token", $token, [
        'expires' => time() + 3600,
        'path' => '/',
        'secure' => true,
        'httponly' => false,  // prevent JS access to cookie
        'samesite' => 'Strict',
    ]);
} else {
    echo json_encode(['message' => 'Missing required fields']);
}

$conn->close();
?>
