<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json");

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

require_once "_auth.php";

$maybeUser = null;
try {
  $maybeUser = require_user($conn);
} catch (Throwable $e) {}

$playlist_id = isset($_GET["playlist_id"]) ? (int) $_GET["playlist_id"] : 0;
if (!$playlist_id) {
  http_response_code(400);
  echo json_encode(["error" => "Missing playlist_id"]);
  exit;
}

$q = $conn->prepare("SELECT owner_id, is_public, name FROM playlists WHERE id=?");
$q->bind_param("i", $playlist_id);
$q->execute();
$pl = $q->get_result()->fetch_assoc();
if (!$pl) {
  http_response_code(404);
  echo json_encode(["error" => "Playlist not found"]);
  exit;
}

$viewer_id = $maybeUser["ID"] ?? -1;
if (!$pl["is_public"] && $pl["owner_id"] != $viewer_id) {
  http_response_code(403);
  echo json_encode(["error" => "Private playlist"]);
  exit;
}
$sql = "
    SELECT 
        ps.song_id AS id,
        ps.position,
        lr.title,
        lr.description,
        lr.recording,
        lr.email,
        ac.Name AS author_name
    FROM playlist_songs ps
    JOIN localRecordings lr ON lr.id = ps.song_id
    LEFT JOIN (
        SELECT Email, MIN(Name) AS Name
        FROM accountCredentials
        GROUP BY Email
    ) ac ON ac.Email = lr.email
    WHERE ps.playlist_id = ?
    ORDER BY ps.position ASC
";


$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $playlist_id);
$stmt->execute();
$result = $stmt->get_result();
$tracks = $result->fetch_all(MYSQLI_ASSOC);

echo json_encode([
  "ok" => true,
  "playlist" => [
    "id" => (int) $playlist_id,
    "name" => $pl["name"],
    "is_public" => (int) $pl["is_public"]
  ],
  "tracks" => $tracks
]);
