<?php
header("Access-Control-Allow-Origin: https://aptitude.cse.buffalo.edu");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$servername = "localhost";
$username   = "ikimos";
$password   = "50445468";
$dbname     = "cse442_2025_fall_team_h_db";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
  http_response_code(500);
  echo json_encode(["ok"=>false,"error"=>"DB connection failed"]);
  exit;
}

if (!isset($_COOKIE["auth_token"])) {
  http_response_code(401);
  echo json_encode(["ok"=>false,"error"=>"Not logged in"]);
  exit;
}
$token = $_COOKIE["auth_token"];

$stmt = $conn->prepare(
  "SELECT accountCredentials.Name
   FROM authTokens
   JOIN accountCredentials ON authTokens.Email = accountCredentials.Email
   WHERE authTokens.Token = ?"
);
$stmt->bind_param("s", $token);
$stmt->execute();
$res = $stmt->get_result();
$userRow = $res->fetch_assoc();
$stmt->close();

if (!$userRow) {
  http_response_code(401);
  echo json_encode(["ok"=>false,"error"=>"Invalid token"]);
  exit;
}
$usernameLike = $userRow["Name"];

$raw = file_get_contents("php://input");
$data = json_decode($raw, true);
$commentId = isset($data["commentId"]) ? intval($data["commentId"]) : 0;
if ($commentId <= 0) {
  http_response_code(400);
  echo json_encode(["ok"=>false,"error"=>"Bad commentId"]);
  exit;
}

$conn->query(
  "CREATE TABLE IF NOT EXISTS forumComments (
     id INT AUTO_INCREMENT PRIMARY KEY,
     postId INT NOT NULL,
     parentId INT NULL,
     author VARCHAR(100) NOT NULL,
     authorId INT NOT NULL,
     content TEXT NOT NULL,
     likesFrom JSON,
     likeCount INT DEFAULT 0,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     INDEX(postId),
     INDEX(parentId),
     CONSTRAINT fk_comments_post FOREIGN KEY (postId) REFERENCES forumPosts(id) ON DELETE CASCADE
   )"
);

$stmt = $conn->prepare("SELECT id, likesFrom FROM forumComments WHERE id = ?");
$stmt->bind_param("i", $commentId);
$stmt->execute();
$res = $stmt->get_result();
$comment = $res->fetch_assoc();
$stmt->close();

if (!$comment) {
  http_response_code(404);
  echo json_encode(["ok"=>false,"error"=>"Comment not found"]);
  exit;
}

$likesFrom = [];
if (!empty($comment["likesFrom"])) {
  $decoded = json_decode($comment["likesFrom"], true);
  if (is_array($decoded)) $likesFrom = $decoded;
}

$idx = array_search($usernameLike, $likesFrom, true);
if ($idx !== false) {
  array_splice($likesFrom, $idx, 1);
  $liked = false;
} else {
  $likesFrom[] = $usernameLike;
  $liked = true;
}

$newLikesFromJson = json_encode(array_values($likesFrom));
$newLikeCount = count($likesFrom);

$stmt = $conn->prepare("UPDATE forumComments SET likesFrom = ?, likeCount = ? WHERE id = ?");
$stmt->bind_param("sii", $newLikesFromJson, $newLikeCount, $commentId);
$ok = $stmt->execute();
$stmt->close();

if (!$ok) {
  http_response_code(500);
  echo json_encode(["ok"=>false,"error"=>"Update failed"]);
  exit;
}

echo json_encode([
  "ok"        => true,
  "commentId" => $commentId,
  "liked"     => $liked,
  "likeCount" => $newLikeCount,
  "likesFrom" => $likesFrom
]);
