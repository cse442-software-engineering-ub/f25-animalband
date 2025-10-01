<?php
header("Access-Control-Allow-Origin: https://your-react-domain.com");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$servername = "localhost";
$username = "ikimos";
$password = "50445468";

$conn = new mysqli($servername, $username, $password, "cse442_2025_fall_team_h_db");

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$makeTokenTable = "CREATE TABLE IF NOT EXISTS authTokens (
    `Email` VARCHAR(50),
    `Token` VARCHAR(255)
)";
$conn->query($makeTokenTable);

$makeTable = "CREATE TABLE IF NOT EXISTS accountCredentials (
    `Name` VARCHAR(50),
    `Email` VARCHAR(50) UNIQUE,
    `Password` VARCHAR(255),
    `ProfilePicture` LONGBLOB NULL
)";
$conn->query($makeTable);

$json = file_get_contents('php://input');
$data = json_decode($json, true);

$email = $data['email'] ?? 'dne';
$password = $data['password'] ?? 'dne';

$stmt = $conn->prepare("SELECT Password FROM accountCredentials WHERE Email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$passwordResult = $stmt->get_result();
$stmt->close();

if ($passwordResult->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Invalid credentials"]);
    exit;
}

$row = $passwordResult->fetch_assoc();
$hashedPwd = $row['Password'];

if (password_verify($password, $hashedPwd)) {
    $token = bin2hex(random_bytes(32));

    $insertToken = $conn->prepare("INSERT INTO authTokens (Email, Token) VALUES (?, ?)");
    $insertToken->bind_param("ss", $email, $token);
    $insertToken->execute();
    $insertToken->close();

    setcookie("auth_token", $token, [
        'expires' => time() + 3600,
        'path' => '/',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);

    echo json_encode(["success" => true, "message" => "Successful login"]);
} else {
    echo json_encode(["success" => false, "message" => "Invalid credentials"]);
}
?>