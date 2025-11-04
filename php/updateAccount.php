<?php
header("Content-Type: application/json");

// === Ensure POST Method ===
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit;
}

// === DB Connection ===
$servername = "localhost";
$username = "ikimos";
$password = "50445468";
$dbname = "cse442_2025_fall_team_h_db";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection error"]);
    exit;
}
$conn->set_charset('utf8mb4');

// === HTML Escape Helper ===
function h($str) {
    return htmlspecialchars($str ?? '', ENT_QUOTES, 'UTF-8');
}

// === Check Auth Token ===
if (empty($_COOKIE['auth_token'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Not logged in"]);
    exit;
}

$token = $_COOKIE['auth_token'];

// === Get User Info ===
$stmt = $conn->prepare("
    SELECT accountCredentials.Email, accountCredentials.Password
    FROM authTokens
    JOIN accountCredentials ON authTokens.Email = accountCredentials.Email
    WHERE authTokens.Token = ?
    LIMIT 1
");
$stmt->bind_param("s", $token);
$stmt->execute();
$res = $stmt->get_result();
$stmt->close();

if ($res->num_rows === 0) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Not logged in"]);
    exit;
}

$user = $res->fetch_assoc();
$currentEmail = $user['Email'];
$currentHash = $user['Password'];

// === Read Input ===
$input = json_decode(file_get_contents('php://input'), true) ?? [];
$newName = isset($input['username']) ? trim($input['username']) : '';
$currentPassword = isset($input['currentPassword']) ? $input['currentPassword'] : '';
$newPassword = isset($input['newPassword']) ? $input['newPassword'] : null;

// === Input Validation ===
if ($newName === '' || mb_strlen($newName) > 50) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid display name"]);
    exit;
}

if (!is_string($currentPassword) || $currentPassword === '') {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Current password required"]);
    exit;
}

if ($newPassword !== null && $newPassword !== '') {
    if (preg_match('/\s/', $newPassword)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "New password cannot contain spaces"]);
        exit;
    }
    if (strlen($newPassword) < 8) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "New password must be at least 8 characters"]);
        exit;
    }
}

// === Verify Current Password ===
if (!password_verify($currentPassword, $currentHash)) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Invalid current password"]);
    exit;
}

// === Update Account ===
if ($newPassword !== null && $newPassword !== '') {
    $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("UPDATE accountCredentials SET Name = ?, Password = ? WHERE Email = ?");
    $stmt->bind_param("sss", $newName, $newHash, $currentEmail);
} else {
    $stmt = $conn->prepare("UPDATE accountCredentials SET Name = ? WHERE Email = ?");
    $stmt->bind_param("ss", $newName, $currentEmail);
}

$ok = $stmt->execute();
$err = h($stmt->error);
$stmt->close();

if (!$ok) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Update failed", "error" => $err]);
    exit;
}

echo json_encode(["success" => true]);
$conn->close();
?>
