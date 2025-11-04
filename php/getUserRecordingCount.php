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

if (!isset($_GET['email'])) {
  http_response_code(400);
  echo json_encode(["error" => "Missing email"]);
  $conn->close();
  exit;
}

$emailParam = trim((string)$_GET['email']);

if (empty($emailParam)) {
  http_response_code(400);
  echo json_encode(["error" => "Invalid email"]);
  $conn->close();
  exit;
}

// Optional: validate email format
if (!filter_var($emailParam, FILTER_VALIDATE_EMAIL)) {
  http_response_code(400);
  echo json_encode(["error" => "Invalid email format"]);
  $conn->close();
  exit;
}

$stmt = $conn->prepare("SELECT COUNT(*) AS count FROM localRecordings WHERE email = ?");

if (!$stmt) {
  http_response_code(500);
  echo json_encode(["error" => "Database query failed"]);
  $conn->close();
  exit;
}

$stmt->bind_param("s", $emailParam);
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