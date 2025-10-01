<?php
header("Access-Control-Allow-Origin: https://your-react-domain.com");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$servername = "localhost";
$username = "ikimos";
$password = "50445468";
$dbname = "cse442_2025_fall_team_h_db";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    die(json_encode(["success" => false, "message" => "DB connection failed"]));
}

// --- Step 1: Check auth token ---
if (!isset($_COOKIE['auth_token'])) {
    echo json_encode(["success" => false, "message" => "Not logged in"]);
    exit;
}

$token = $_COOKIE['auth_token'];
$stmt = $conn->prepare("SELECT Email FROM authTokens WHERE Token = ?");
$stmt->bind_param("s", $token);
$stmt->execute();
$result = $stmt->get_result();
if ($result->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Invalid token"]);
    exit;
}
$row = $result->fetch_assoc();
$email = $row['Email'];
$stmt->close();

// --- Step 2: Handle upload ---
if (!isset($_FILES['profilePic'])) {
    echo json_encode(["success" => false, "message" => "No file uploaded"]);
    exit;
}

$fileTmp = $_FILES['profilePic']['tmp_name'];
$imageData = file_get_contents($fileTmp);

$update = $conn->prepare("UPDATE accountCredentials SET ProfilePicture = ? WHERE Email = ?");
$update->bind_param("bs", $imageData, $email);
$update->send_long_data(0, $imageData);
$update->execute();
$update->close();

echo json_encode(["success" => true, "message" => "Profile picture updated"]);
?>