<?php
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] !== 'POST'){
    http_response_code(405);
    echo json_encode(["success"=>false, "message"=>"Method not allowed"]);
    exit;
}

// Connect to DB
$servername = "localhost";
$username = "ikimos";
$password = "50445468";
$dbname = "cse442_2025_fall_team_h_db";
$conn = new mysqli($servername, $username, $password, $dbname);

// DB Error Check
if($conn->connect_error){
    http_response_code(500);
    echo json_encode(["success"=>false, "message"=>"DB error"]);
    exit;
}
$conn->set_charset('utf8mb4');

// Cookie/Sessin Check
if(empty($_COOKIE['auth_token'])){
    http_response_code(401);
    echo json_encode(["success"=>false, "message"=>"Not logged in"]);
    exit;
}

$token = $_COOKIE['auth_token'];

// Get email & hashed pw from auth token
$stmt = $conn->prepare("SELECT accountCredentials.Email, accountCredentials.Password
                        FROM authTokens
                        JOIN accountCredentials ON authTokens.Email = accountCredentials.Email
                        WHERE authTokens.Token = ?
                        LIMIT 1
");
$stmt->bind_param("s", $token);
$stmt->execute();
$res = $stmt->get_result();
$stmt->close();

// Check for invalid session
if($res->num_rows === 0){
    http_response_code(401);
    echo json_encode(["success"=>false, "message"=>"Not logged in"]);
    exit;
}

// Stored Info
$user = $res->fetch_assoc();
$currentEmail = $user['Email'];
$hash = $user['Password'];

// User Submitted Info
$input = json_decode(file_get_contents('php://input'), true) ?? [];
$newName = isset($input['username']) ? trim($input['username']) : '';
$currentPassword = $input['currentPassword'] ?? '';
$newPassword = $input['newPassword'] ?? null;

// Validation
if($newName === '' || mb_strlen($newName) > 50){
    http_response_code(400);
    echo json_encode(["success"=>false, "message"=>"Invalid display name"]);
    exit;
}
if(!is_string($currentPassword) || $currentPassword === ''){
    http_response_code(400);
    echo json_encode(["success"=>false, "message"=>"Current password required"]);
    exit;
}
if($newPassword !== null && $newPassword !== '' && strlen($newPassword) < 8) {
    http_response_code(400);
    echo json_encode(["success"=>false, "message"=>"New password must be at least 8 characters"]);
    exit;
}

// Verify Password
if(!password_verify($currentPassword, $hash)){
    http_response_code(401);
    echo json_encode(["success"=>false, "message"=>"Invalid Password"]);
    exit;
}

if($newPassword !== null && $newPassword !== ''){
    $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("UPDATE accountCredentials
                            SET Name = ?, Password = ?
                            WHERE Email = ?"
                            );
    $stmt->bind_param("sss", $newName, $newHash, $currentEmail);
}
else{
    $stmt = $conn->prepare("UPDATE accountCredentials
                            SET Name = ?
                            WHERE Email = ?");
    $stmt->bind_param("ss", $newName, $currentEmail);
}

$ok = $stmt->execute();
$err = $stmt->error;
$stmt->close();

if(!$ok){
    http_response_code(500);
    echo json_encode(["success"=>false, "message"=>"Update failed", "error"=>$err]);
    exit;
}
echo json_encode(["success"=>true]);