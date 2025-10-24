<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$mysqli = new mysqli("localhost", "ikimos", "50445468", "cse442_2025_fall_team_h_db");
if ($mysqli->connect_error) { http_response_code(500); echo json_encode([]); exit; }

$postId = isset($_GET["postId"]) ? intval($_GET["postId"]) : 0;
if ($postId <= 0) { echo json_encode([]); exit; }

$sql = "SELECT id, postId, parentId, author, authorId, content, likesFrom, likeCount, created_at
        FROM forumComments
        WHERE postId = ?
        ORDER BY likeCount DESC, created_at ASC";

$stmt = $mysqli->prepare($sql);
$stmt->bind_param("i", $postId);
$stmt->execute();
$res = $stmt->get_result();

$out = [];
while ($row = $res->fetch_assoc()) {
  $row["likesFrom"] = $row["likesFrom"] ? json_decode($row["likesFrom"], true) : [];
  $row["parentId"] = $row["parentId"] ? intval($row["parentId"]) : null;
  $row["id"] = intval($row["id"]);
  $row["postId"] = intval($row["postId"]);
  $row["authorId"] = intval($row["authorId"]);
  $row["likeCount"] = intval($row["likeCount"]);
  $out[] = $row;
}
echo json_encode($out);
