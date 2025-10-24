<?php
header("Access-Control-Allow-Origin: https://aptitude.cse.buffalo.edu");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");

ini_set('display_errors', 0);

$servername = "localhost";
$username   = "ikimos";
$password   = "50445468";
$dbname     = "cse442_2025_fall_team_h_db";

$mysqli = new mysqli($servername, $username, $password, $dbname);
if ($mysqli->connect_error) {
  http_response_code(500);
  echo json_encode(["success"=>false,"message"=>"DB connection failed"]);
  exit;
}

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

$postId   = isset($payload["postId"]) ? intval($payload["postId"]) : 0;
$parentId = array_key_exists("parentId", $payload) && $payload["parentId"] !== null
            ? intval($payload["parentId"]) : null;
$content  = isset($payload["content"]) ? trim($payload["content"]) : "";
if (mb_strlen($content, 'UTF-8') > 500) {
  http_response_code(400);
  echo json_encode(["success" => false, "message" => "Comment exceeds 500 characters"]);
  exit;
}
$author   = "";
$authorId = 0;

if (isset($_COOKIE["auth_token"])) {
  $token = $_COOKIE["auth_token"];
  $stmt = $mysqli->prepare("
    SELECT a.ID, a.Name
    FROM authTokens t
    JOIN accountCredentials a ON a.Email = t.Email
    WHERE t.Token = ?
    LIMIT 1
  ");
  $stmt->bind_param("s", $token);
  $stmt->execute();
  $res = $stmt->get_result();
  if ($row = $res->fetch_assoc()) {
    $authorId = (int)$row["ID"];
    $author   = $row["Name"];
  }
  $stmt->close();
}

if ((!$author || !$authorId) && isset($payload["author"], $payload["authorId"])) {
  $author   = (string)$payload["author"];
  $authorId = (int)$payload["authorId"];
}

if ($postId <= 0 || mb_strlen($content, 'UTF-8') === 0 || $author === "" || $authorId <= 0) {
  http_response_code(400);
  echo json_encode(["success"=>false,"message"=>"Invalid fields"]);
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
  echo json_encode(["success"=>false,"message"=>"Prepare failed"]);
  exit;
}

$ok = $stmt->execute();
$insertId = $ok ? $stmt->insert_id : 0;
$err = $stmt->error;
$stmt->close();

if (!$ok) {
  http_response_code(500);
  echo json_encode(["success"=>false,"message"=>$err ?: "Insert failed"]);
  exit;
}

$mysqli->query("UPDATE forumPosts SET comments = comments + 1 WHERE id = ".intval($postId));

echo json_encode([
  "success"   => true,
  "id"        => (int)$insertId,
  "postId"    => (int)$postId,
  "parentId"  => $parentId,
  "author"    => $author,
  "authorId"  => (int)$authorId,
  "likeCount" => (int)$likeCount,
  "likesFrom" => $likesFromArr,
  "content"   => $content
]);
