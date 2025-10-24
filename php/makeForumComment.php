<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");

$mysqli = new mysqli("localhost", "ikimos", "50445468", "cse442_2025_fall_team_h_db");
if ($mysqli->connect_error) {
  http_response_code(500);
  echo json_encode(["success"=>false,"message"=>"DB connection failed"]);
  exit;
}

// Ensure table exists (safe to leave here)
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

$payload = json_decode(file_get_contents("php://input"), true);
if (!$payload) {
  echo json_encode(["success"=>false,"message"=>"No JSON body"]);
  exit;
}

$postId   = isset($payload["postId"]) ? intval($payload["postId"]) : 0;
$parentId = array_key_exists("parentId", $payload) && $payload["parentId"] !== null
            ? intval($payload["parentId"]) : null;
$content  = isset($payload["content"]) ? trim($payload["content"]) : "";

// If you later use sessions, you can prefer them:
session_start();
$author   = $_SESSION["username"] ?? ($payload["author"] ?? "");
$authorId = isset($_SESSION["id"]) ? intval($_SESSION["id"]) : intval($payload["authorId"] ?? 0);

if ($postId <= 0 || $content === "" || $author === "" || $authorId <= 0) {
  echo json_encode(["success"=>false,"message"=>"Invalid fields"]);
  exit;
}

if ($parentId === null) {
  // parentId = NULL case needs a different statement (can't bind NULL reliably as an int placeholder on all setups)
  $stmt = $mysqli->prepare("INSERT INTO forumComments (postId, parentId, author, authorId, content, likesFrom, likeCount) VALUES (?, NULL, ?, ?, ?, '[]', 0)");
  if (!$stmt) { echo json_encode(["success"=>false,"message"=>"Prepare failed"]); exit; }
  // i s i s
  $stmt->bind_param("isis", $postId, $author, $authorId, $content);
} else {
  $stmt = $mysqli->prepare("INSERT INTO forumComments (postId, parentId, author, authorId, content, likesFrom, likeCount) VALUES (?, ?, ?, ?, ?, '[]', 0)");
  if (!$stmt) { echo json_encode(["success"=>false,"message"=>"Prepare failed"]); exit; }
  // i i s i s
  $stmt->bind_param("iisis", $postId, $parentId, $author, $authorId, $content);
}

$ok = $stmt->execute();
if (!$ok) {
  echo json_encode(["success"=>false,"message"=>$stmt->error]);
  exit;
}

// bump comment count on the post
$mysqli->query("UPDATE forumPosts SET comments = comments + 1 WHERE id = ".intval($postId));

echo json_encode(["success"=>true, "id"=>$mysqli->insert_id]);
