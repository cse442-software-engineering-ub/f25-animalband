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
  echo "data: {\"error\":\"db connection failed\"}\n\n";
  flush();
  exit;
}

$lastMax = 0;
$res = $mysqli->query("SELECT COALESCE(MAX(id),0) AS maxid FROM forumPosts");
if ($res && $row = $res->fetch_assoc()) $lastMax = (int)$row['maxid'];

while (true) {
  $res2 = $mysqli->query("SELECT COALESCE(MAX(id),0) AS maxid FROM forumPosts");
  $row2 = $res2 ? $res2->fetch_assoc() : ['maxid' => $lastMax];
  $maxid = (int)$row2['maxid'];

  if ($maxid > $lastMax) {
    $lastMax = $maxid;
    echo "event: posts\n";
    echo "data: {\"maxId\": $maxid}\n\n";
    flush();
  }
  echo "data: {\"heartbeat\":true}\n\n";
  flush();
  sleep(5);
}
