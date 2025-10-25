<?php
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('Connection: keep-alive');
header('Access-Control-Allow-Origin: https://aptitude.cse.buffalo.edu');

@ob_end_flush();
@ob_implicit_flush(1);
ignore_user_abort(true);
set_time_limit(0);

$mysqli = new mysqli("localhost", "ikimos", "50445468", "cse442_2025_fall_team_h_db");
if ($mysqli->connect_error) {
  http_response_code(500);
  echo "data: {\"error\":\"db connection failed\"}\n\n";
  flush();
  exit;
}

$postId = isset($_GET['postId']) ? (int)$_GET['postId'] : 0;
if ($postId <= 0) {
  echo "data: {\"error\":\"bad postId\"}\n\n";
  flush();
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

$lastMax = 0;
$lastCnt = 0;
$lastSum = 0;

$stmt = $mysqli->prepare("SELECT COALESCE(MAX(id),0) AS maxid, COUNT(*) AS cnt, COALESCE(SUM(likeCount),0) AS lsum FROM forumComments WHERE postId = ?");
$stmt->bind_param("i", $postId);
$stmt->execute();
$res = $stmt->get_result();
if ($row = $res->fetch_assoc()) {
  $lastMax = (int)$row['maxid'];
  $lastCnt = (int)$row['cnt'];
  $lastSum = (int)$row['lsum'];
}
$stmt->close();

while (true) {
  $stmt = $mysqli->prepare("SELECT COALESCE(MAX(id),0) AS maxid, COUNT(*) AS cnt, COALESCE(SUM(likeCount),0) AS lsum FROM forumComments WHERE postId = ?");
  $stmt->bind_param("i", $postId);
  $stmt->execute();
  $res = $stmt->get_result();
  $row = $res ? $res->fetch_assoc() : ['maxid'=>$lastMax,'cnt'=>$lastCnt,'lsum'=>$lastSum];
  $stmt->close();

  $maxid = (int)$row['maxid'];
  $cnt   = (int)$row['cnt'];
  $lsum  = (int)$row['lsum'];

  if ($maxid !== $lastMax || $cnt !== $lastCnt || $lsum !== $lastSum) {
    $lastMax = $maxid; $lastCnt = $cnt; $lastSum = $lsum;
    echo "event: comments\n";
    echo "data: {\"postId\": $postId, \"maxId\": $maxid, \"count\": $cnt, \"likeSum\": $lsum}\n\n";
    flush();
  }

  echo "data: {\"heartbeat\":true}\n\n";
  flush();

  sleep(5);

  if (connection_aborted()) break;
}
