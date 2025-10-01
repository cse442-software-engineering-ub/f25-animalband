<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json");

$servername = "localhost";
$username = "ikimos";
$password = "50445468";

$conn = new mysqli($servername, $username, $password, "cse442_2025_fall_team_h_db");

if ($conn->connect_error) {
    die(json_encode(["success" => false, "message" => "DB connection failed"]));
}

// Make table if not exists
$makeTable = "CREATE TABLE IF NOT EXISTS profilePictures (
    `Email` VARCHAR(50) PRIMARY KEY,
    `ImagePath` VARCHAR(255)
)";
$conn->query($makeTable);

$email = $_POST['email'] ?? '';
if (!$email || !isset($_FILES['profilePic'])) {
    echo json_encode(["success" => false, "message" => "Missing data"]);
    exit;
}

$uploadDir = "uploads/";
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

$fileName = uniqid() . "_" . basename($_FILES["profilePic"]["name"]);
$targetPath = $uploadDir . $fileName;

if (move_uploaded_file($_FILES["profilePic"]["tmp_name"], $targetPath)) {
    // Save path to DB
    $stmt = $conn->prepare("REPLACE INTO profilePictures (Email, ImagePath) VALUES (?, ?)");
    $stmt->bind_param("ss", $email, $targetPath);
    $stmt->execute();
    $stmt->close();

    echo json_encode(["success" => true, "imagePath" => $targetPath]);
} else {
    echo json_encode(["success" => false, "message" => "Upload failed"]);
}
?>