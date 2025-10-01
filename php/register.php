<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$servername = "localhost";
$username = "ikimos";
$password = "50445468";
$dbname = "cse442_2025_fall_team_h_db";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$makeTable = "CREATE TABLE IF NOT EXISTS accountCredentials (
    Name VARCHAR(50),
    Email VARCHAR(50),
    Password VARCHAR(255),
    ProfilePic VARCHAR(255)  -- new column for file path
)";
$conn->query($makeTable);

// Get form values
$username = $_POST['username'] ?? 'dne';
$email = $_POST['email'] ?? 'dne';
$password = $_POST['password'] ?? 'dne';

$hashedPwd = password_hash($password, PASSWORD_DEFAULT);

$profilePicPath = null;
if (isset($_FILES['profile_pic']) && $_FILES['profile_pic']['error'] === UPLOAD_ERR_OK) {
    $uploadDir = "uploads/";
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $ext = pathinfo($_FILES['profile_pic']['name'], PATHINFO_EXTENSION);
    $safeName = uniqid("pfp_", true) . "." . $ext;
    $targetPath = $uploadDir . $safeName;

    if (move_uploaded_file($_FILES['profile_pic']['tmp_name'], $targetPath)) {
        $profilePicPath = $targetPath;
    }
}

$stmt = $conn->prepare("INSERT INTO accountCredentials (Name, Email, Password, ProfilePic) VALUES (?, ?, ?, ?)");
$stmt->bind_param("ssss", $username, $email, $hashedPwd, $profilePicPath);

if ($stmt->execute()) {
    echo json_encode(['message' => 'User registered successfully']);
} else {
    echo json_encode(['message' => 'Error: ' . $stmt->error]);
}
$stmt->close();

// Generate token (unchanged from before)
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

$conn->close();
?>
