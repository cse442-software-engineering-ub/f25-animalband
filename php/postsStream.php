<?php
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('Connection: keep-alive');
header('Access-Control-Allow-Origin: https://aptitude.cse.buffalo.edu');
@ob_end_flush();
@ob_implicit_flush(1);
$mysqli = new mysqli("localhost", "ikimos", "50445468", "cse442_2025_fall_team_h_db");
if ($mysqli->connect_error) {
  http_response_code(500);
  echo "data: " . json_encode(["error" => "db connection failed"]) . "\n\n";
  flush();
  exit;
}
$lastMax = 0;
$stmt = $mysqli->prepare("SELECT COALESCE(MAX(id),0) AS maxid FROM forumPosts");
$stmt->execute();
$res = $stmt->get_result();
if ($res && $row = $res->fetch_assoc()) $lastMax = (int)$row['maxid'];
$stmt->close();
while (true) {
  $stmt2 = $mysqli->prepare("SELECT COALESCE(MAX(id),0) AS maxid FROM forumPosts");
  $stmt2->execute();
  $res2 = $stmt2->get_result();
  $row2 = $res2 ? $res2->fetch_assoc() : ['maxid' => $lastMax];
  $stmt2->close();
  $maxid = (int)$row2['maxid'];
  if ($maxid > $lastMax) {
    $lastMax = $maxid;
    echo "event: posts\n";
    echo "data: " . json_encode(["maxId" => $maxid]) . "\n\n";
    flush();
  }
  echo "data: " . json_encode(["heartbeat" => true]) . "\n\n";
  flush();
  sleep(5);
}
?>