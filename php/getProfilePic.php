<?php
$servername = "localhost";
$username = "ikimos";
$password = "50445468";
$dbname = "cse442_2025_fall_team_h_db";

$conn = new mysqli($servername, $username, $password, $dbname);

if (!isset($_COOKIE['auth_token'])) {
    http_response_code(403);
    exit;
}

$token = $_COOKIE['auth_token'];
$stmt = $conn->prepare("SELECT Email FROM authTokens WHERE Token = ?");
$stmt->bind_param("s", $token);
$stmt->execute();
$result = $stmt->get_result();
if ($result->num_rows === 0) {
    http_response_code(403);
    exit;
}
$row = $result->fetch_assoc();
$email = $row['Email'];
$stmt->close();

$stmt = $conn->prepare("SELECT ProfilePicture FROM accountCredentials WHERE Email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->bind_result($picData);
$stmt->fetch();
$stmt->close();

if ($picData) {
    header("Content-Type: image/jpeg"); // adjust if you want PNG
    echo $picData;
} else {
    http_response_code(404);
}
?>