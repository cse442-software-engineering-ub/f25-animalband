<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$mysqli = new mysqli("localhost", "ikimos", "50445468", "cse442_2025_fall_team_h_db");
if ($mysqli->connect_error) { echo json_encode(["ok"=>false,"error"=>"DB error"]); exit; }

$data = json_decode(file_get_contents("php://input"), true);
$commentId = intval($data["commentId"] ?? 0);
if ($commentId<=0) { echo json_encode(["ok"=>false,"error"=>"bad id"]); exit; }

// identify user (same caveat as above; align with your auth)
session_start();
$username = $_SESSION["username"] ?? null;
if (!$username) { echo json_encode(["ok"=>false,"error"=>"not logged in"]); exit; }

$res = $mysqli->query("SELECT likesFrom, likeCount FROM forumComments WHERE id = ".$commentId." LIMIT 1");
if (!$res || $res->num_rows===0) { echo json_encode(["ok"=>false,"error"=>"not found"]); exit; }
$row = $res->fetch_assoc();
$likes = $row["likesFrom"] ? json_decode($row["likesFrom"], true) : [];

$liked = in_array($username, $likes, true);
if ($liked) {
  $likes = array_values(array_filter($likes, fn($u) => $u !== $username));
} else {
  $likes[] = $username;
}
$likeCount = count($likes);

$stmt = $mysqli->prepare("UPDATE forumComments SET likesFrom=?, likeCount=? WHERE id=?");
$likesJson = json_encode($likes);
$stmt->bind_param("sii", $likesJson, $likeCount, $commentId);
$stmt->execute();

echo json_encode(["ok"=>true, "liked"=>!$liked, "likeCount"=>$likeCount, "likesFrom"=>$likes]);
