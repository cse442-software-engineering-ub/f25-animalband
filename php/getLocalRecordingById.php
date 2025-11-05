<?php
// getLocalRecordingById.php
// Fetch a single recording by id and return its note JSON.

// CORS + JSON
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

// ---- DB CONFIG ----
$servername = "localhost";
$username   = "ikimos";
$password   = "50445468";
$dbname     = "cse442_2025_fall_team_h_db";

// ---- INPUT ----
$id = isset($_GET["id"]) ? (int)$_GET["id"] : 0;
if ($id <= 0) {
  http_response_code(400);
  echo json_encode(["success" => false, "message" => "bad id"]);
  exit;
}



mysqli_report(MYSQLI_REPORT_OFF);
$conn = @new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
  http_response_code(500);
  echo json_encode(["success" => false, "message" => "db connection failed"]);
  exit;
}

$sql = "SELECT id, title, description, recording FROM localRecordings WHERE id = ? LIMIT 1";
$stmt = $conn->prepare($sql);
if (!$stmt) {
  http_response_code(500);
  echo json_encode(["success" => false, "message" => "prepare failed"]);
  exit;
}
$stmt->bind_param("i", $id);
// If enforcing owner: $stmt->bind_param("ii", $id, $ownerIdFromToken);
$stmt->execute();
$res = $stmt->get_result();
$row = $res->fetch_assoc();

if (!$row) {
  http_response_code(404);
  echo json_encode(["success" => false, "message" => "not found"]);
  exit;
}

// recording column stores JSON (array of notes or array of tracks-of-notes)
$recJson = $row["recording"];
$recording = json_decode($recJson, true);
if (!is_array($recording)) $recording = [];

echo json_encode([
  "success"     => true,
  "id"          => (int)$row["id"],
  "title"       => $row["title"] ?? ("Recording #".$row["id"]),
  "description" => $row["description"] ?? "",
  "recording"   => $recording
]);
