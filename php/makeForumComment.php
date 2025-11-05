<?php
header("Access-Control-Allow-Origin: https://aptitude.cse.buffalo.edu");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");

ini_set('display_errors', 0);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

$servername = "localhost";
$username   = "ikimos";
$password   = "50445468";
$dbname     = "cse442_2025_fall_team_h_db";
$mysqli = new mysqli($servername, $username, $password, $dbname);

if ($mysqli->connect_error) {
  http_response_code(500);
  echo json_encode(["success"=>false,"message"=>"Database connection failed"]);
  exit;
}

$mysqli->set_charset("utf8mb4");

$mysqli->query("
  CREATE TABLE IF NOT EXISTS forumComments (
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
  )
");

$raw = file_get_contents("php://input");
$payload = json_decode($raw, true);
if (!is_array($payload)) $payload = [];

$postId   = isset($payload["postId"]) ? intval($payload["postId"]) : 0;
$parentId = array_key_exists("parentId", $payload) && $payload["parentId"] !== null
            ? intval($payload["parentId"]) : null;
$content  = isset($payload["content"]) ? trim((string)$payload["content"]) : "";

if (mb_strlen($content, 'UTF-8') > 500) {
  http_response_code(400);
  echo json_encode(["success" => false, "message" => "Comment exceeds 500 characters"]);
  $mysqli->close();
  exit;
}

$author   = "";
$authorId = 0;

if (isset($_COOKIE["auth_token"])) {
  $token = trim((string)$_COOKIE["auth_token"]);
  
  if (!empty($token)) {
    $stmt = $mysqli->prepare("
      SELECT a.ID, a.Name
      FROM authTokens t
      JOIN accountCredentials a ON a.Email = t.Email
      WHERE t.Token = ?
      LIMIT 1
    ");
    
    if (!$stmt) {
      http_response_code(500);
      echo json_encode(["success"=>false,"message"=>"Database query failed"]);
      $mysqli->close();
      exit;
    }
    
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($row = $res->fetch_assoc()) {
      $authorId = (int)$row["ID"];
      $author   = $row["Name"];
    }
    $stmt->close();
  }
}

if ((!$author || !$authorId) && isset($payload["author"], $payload["authorId"])) {
  $author   = trim((string)$payload["author"]);
  $authorId = (int)$payload["authorId"];
}

if ($postId <= 0 || mb_strlen($content, 'UTF-8') === 0 || $author === "" || $authorId <= 0) {
  http_response_code(400);
  echo json_encode(["success"=>false,"message"=>"Invalid fields"]);
  $mysqli->close();
  exit;
}

$likesFromArr = [$author];
$likesFromJson = json_encode($likesFromArr);
$likeCount = 1;

if ($parentId === null) {
  $stmt = $mysqli->prepare("
    INSERT INTO forumComments
      (postId, parentId, author, authorId, content, likesFrom, likeCount)
    VALUES
      (?, NULL, ?, ?, ?, ?, ?)
  ");
  $stmt->bind_param("isissi", $postId, $author, $authorId, $content, $likesFromJson, $likeCount);
} else {
  $stmt = $mysqli->prepare("
    INSERT INTO forumComments
      (postId, parentId, author, authorId, content, likesFrom, likeCount)
    VALUES
      (?, ?, ?, ?, ?, ?, ?)
  ");
  $stmt->bind_param("iisissi", $postId, $parentId, $author, $authorId, $content, $likesFromJson, $likeCount);
}

if (!$stmt) {
  http_response_code(500);
  echo json_encode(["success"=>false,"message"=>"Database query failed"]);
  $mysqli->close();
  exit;
}

$ok = $stmt->execute();
$insertId = $ok ? $stmt->insert_id : 0;
$stmt->close();

if (!$ok) {
  http_response_code(500);
  echo json_encode(["success"=>false,"message"=>"Insert failed"]);
  $mysqli->close();
  exit;
}

// CRITICAL FIX: Use prepared statement instead of string concatenation
$updateStmt = $mysqli->prepare("UPDATE forumPosts SET comments = comments + 1 WHERE id = ?");
if ($updateStmt) {
  $updateStmt->bind_param("i", $postId);
  $updateStmt->execute();
  $updateStmt->close();
}

// Escape usernames in likesFrom array for safe output
$escapedLikesFrom = array_map(function($username) {
  return htmlspecialchars($username, ENT_QUOTES, 'UTF-8');
}, $likesFromArr);

echo json_encode([
  "success"   => true,
  "id"        => (int)$insertId,
  "postId"    => (int)$postId,
  "parentId"  => $parentId,
  "author"    => htmlspecialchars($author, ENT_QUOTES, 'UTF-8'),
  "authorId"  => (int)$authorId,
  "likeCount" => (int)$likeCount,
  "likesFrom" => $escapedLikesFrom,
  "content"   => htmlspecialchars($content, ENT_QUOTES, 'UTF-8')
], JSON_UNESCAPED_UNICODE);

$mysqli->close();
?>