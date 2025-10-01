<?php
// Secure CORS setup — replace with your React frontend domain
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

// --- Ensure tables exist ---
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

// --- Parse JSON input ---
$json = file_get_contents('php://input');
$data = json_decode($json, true);

$username = $data['username'] ?? '';
$email = $data['email'] ?? '';
$password = $data['password'] ?? '';

if (!$username || !$email || !$password) {
    echo json_encode(["success" => false, "message" => "Missing required fields"]);
    exit;
}

// --- Hash password ---
$hashedPwd = password_hash($password, PASSWORD_DEFAULT);

// --- Insert into DB ---
$stmt = $conn->prepare("INSERT INTO accountCredentials (Name, Email, Password) VALUES (?, ?, ?)");
$stmt->bind_param("sss", $username, $email, $hashedPwd);

if (!$stmt->execute()) {
    echo json_encode(["success" => false, "message" => "Error: " . $stmt->error]);
    $stmt->close();
    $conn->close();
    exit;
}
$stmt->close();

// --- Create login token ---
$token = bin2hex(random_bytes(32));
$stmt = $conn->prepare("INSERT INTO authTokens (Email, Token) VALUES (?, ?)");
$stmt->bind_param("ss", $email, $token);
$stmt->execute();
$stmt->close();

// --- Set cookie securely ---
setcookie("auth_token", $token, [
    'expires' => time() + 3600,
    'path' => '/',
    'secure' => true,    // require HTTPS
    'httponly' => true,  // JS cannot access cookie
    'samesite' => 'Strict',
]);

// --- Respond ---
echo json_encode(["success" => true, "message" => "User registered successfully"]);
$conn->close();
?>
