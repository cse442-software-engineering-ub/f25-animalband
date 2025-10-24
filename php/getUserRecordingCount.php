<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$servername = "localhost";
$username = "ikimos";
$password = "50445468";
$dbname = "cse442_2025_fall_team_h_db";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
  echo json_encode(["error" => "DB connection failed"]);
  exit;
}

if (!isset($_GET['email'])) {
  echo json_encode(["error" => "Missing email"]);
  exit;
}

$email = $conn->real_escape_string($_GET['email']);

$sql = "SELECT COUNT(*) AS count FROM localRecordings WHERE email = '$email'";
$result = $conn->query($sql);

if ($result && $row = $result->fetch_assoc()) {
  echo json_encode(["count" => (int)$row["count"]]);
} else {
  echo json_encode(["count" => 0]);
}

$conn->close();
?>
