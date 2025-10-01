<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$servername = "localhost";
$username = "ikimos";
$password = "50445468";

$conn = new mysqli($servername, $username, $password, "cse442_2025_fall_team_h_db");

if ($conn->connect_error) {
    die(json_encode(["success" => false, "message" => "DB connection failed"]));
}

$email = $_GET['email'] ?? '';
if (!$email) {
    echo json_encode(["success" => false, "message" => "No email provided"]);
    exit;
}

$stmt = $conn->prepare("SELECT ImagePath FROM profilePictures WHERE Email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();
$stmt->close();

if ($row && $row['ImagePath']) {
    echo json_encode(["success" => true, "imagePath" => $row['ImagePath']]);
} else {
    echo json_encode(["success" => true, "imagePath" => null]); // fallback to default
}
?>