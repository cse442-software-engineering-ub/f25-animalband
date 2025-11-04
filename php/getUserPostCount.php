<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

$servername = "localhost";
$username = "ikimos";
$password = "50445468";
$dbname = "cse442_2025_fall_team_h_db";
$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
  http_response_code(500);
  echo json_encode(["error" => "Database connection failed"]);
  exit;
}

$conn->set_charset("utf8mb4");

if (!isset($_GET['username'])) {
  http_response_code(400);
  echo json_encode(["error" => "Missing username"]);
  $conn->close();
  exit;
}

$usernameParam = trim((string)$_GET['username']);

if (empty($usernameParam)) {
  http_response_code(400);
  echo json_encode(["error" => "Invalid username"]);
  $conn->close();
  exit;
}

$stmt = $conn->prepare("SELECT COUNT(*) AS count FROM forumPosts WHERE author = ?");

if (!$stmt) {
  http_response_code(500);
  echo json_encode(["error" => "Database query failed"]);
  $conn->close();
  exit;
}

$stmt->bind_param("s", $usernameParam);
$stmt->execute();
$result = $stmt->get_result();

if ($result && $row = $result->fetch_assoc()) {
  echo json_encode(["count" => (int)$row["count"]]);
} else {
  echo json_encode(["count" => 0]);
}

$stmt->close();
$conn->close();
?>