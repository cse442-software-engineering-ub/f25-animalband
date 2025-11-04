<?php
header("Access-Control-Allow-Origin: https://aptitude.cse.buffalo.edu");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$servername = "localhost";
$username   = "ikimos";
$password   = "50445468";
$dbname     = "cse442_2025_fall_team_h_db";
$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["ok"=>false,"error"=>"Database connection failed"]);
    exit;
}

$conn->set_charset("utf8mb4");

if (!isset($_COOKIE["auth_token"])) {
    http_response_code(401);
    echo json_encode(["ok"=>false,"error"=>"Not logged in"]);
    $conn->close();
    exit;
}

$token = trim((string)$_COOKIE["auth_token"]);

if (empty($token)) {
    http_response_code(401);
    echo json_encode(["ok"=>false,"error"=>"Invalid token"]);
    $conn->close();
    exit;
}

$stmt = $conn->prepare("
    SELECT accountCredentials.Name
    FROM authTokens 
    JOIN accountCredentials ON authTokens.Email = accountCredentials.Email
    WHERE authTokens.Token = ?
");

if (!$stmt) {
    http_response_code(500);
    echo json_encode(["ok"=>false,"error"=>"Database query failed"]);
    $conn->close();
    exit;
}

$stmt->bind_param("s", $token);
$stmt->execute();
$res = $stmt->get_result();
$userRow = $res->fetch_assoc();
$stmt->close();

if (!$userRow) {
    http_response_code(401);
    echo json_encode(["ok"=>false,"error"=>"Invalid token"]);
    $conn->close();
    exit;
}

$usernameLike = $userRow["Name"];

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) $data = [];

$postId = isset($data['postId']) ? intval($data['postId']) : 0;

if ($postId <= 0) {
    http_response_code(400);
    echo json_encode(["ok"=>false,"error"=>"Bad postId"]);
    $conn->close();
    exit;
}

$stmt = $conn->prepare("SELECT id, likesFrom, likeCount FROM forumPosts WHERE id = ?");

if (!$stmt) {
    http_response_code(500);
    echo json_encode(["ok"=>false,"error"=>"Database query failed"]);
    $conn->close();
    exit;
}

$stmt->bind_param("i", $postId);
$stmt->execute();
$res = $stmt->get_result();
$post = $res->fetch_assoc();
$stmt->close();

if (!$post) {
    http_response_code(404);
    echo json_encode(["ok"=>false,"error"=>"Post not found"]);
    $conn->close();
    exit;
}

$likesFrom = [];
if (!empty($post["likesFrom"])) {
    $decoded = json_decode($post["likesFrom"], true);
    if (is_array($decoded)) $likesFrom = $decoded;
}

$idx = array_search($usernameLike, $likesFrom, true);
if ($idx !== false) {
    array_splice($likesFrom, $idx, 1);
    $liked = false;
} 
else {
    $likesFrom[] = $usernameLike;
    $liked = true;
}

$newLikesFromJson = json_encode(array_values($likesFrom));
$newLikeCount = count($likesFrom);

$stmt = $conn->prepare("UPDATE forumPosts SET likesFrom = ?, likeCount = ? WHERE id = ?");

if (!$stmt) {
    http_response_code(500);
    echo json_encode(["ok"=>false,"error"=>"Database query failed"]);
    $conn->close();
    exit;
}

$stmt->bind_param("sii", $newLikesFromJson, $newLikeCount, $postId);
$ok = $stmt->execute();
$stmt->close();

if (!$ok) {
    http_response_code(500);
    echo json_encode(["ok"=>false,"error"=>"Update failed"]);
    $conn->close();
    exit;
}

// Escape usernames in likesFrom array for safe output
$escapedLikesFrom = array_map(function($username) {
    return htmlspecialchars($username, ENT_QUOTES, 'UTF-8');
}, $likesFrom);

echo json_encode([
    "ok" => true,
    "postId" => $postId,
    "liked" => $liked,
    "likeCount" => $newLikeCount,
    "likesFrom" => $escapedLikesFrom
], JSON_UNESCAPED_UNICODE);

$conn->close();
?>