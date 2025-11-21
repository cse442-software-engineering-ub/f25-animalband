<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
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
function get_json_body()
{
  $raw = file_get_contents("php://input");
  if (!$raw)
    return [];
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}
function escape_user_data($user)
{
  if (!$user) return null;
  return [
    'ID' => $user['ID'],
    'Name' => htmlspecialchars($user['Name'], ENT_QUOTES, 'UTF-8'),
    'Email' => htmlspecialchars($user['Email'], ENT_QUOTES, 'UTF-8')
  ];
}
function require_user($conn)
{
  $body = get_json_body();
  $auth_token = isset($body["auth_token"]) ? trim((string) $body["auth_token"]) : "";
  if ($auth_token === "" && isset($_COOKIE["auth_token"])) {
    $auth_token = trim((string) $_COOKIE["auth_token"]);
  }
  if ($auth_token === "") {
    http_response_code(401);
    echo json_encode(["error" => "Missing auth token"]);
    exit;
  }
  $stmt = $conn->prepare("SELECT Email FROM authTokens WHERE Token = ?");
  $stmt->bind_param("s", $auth_token);
  $stmt->execute();
  $res = $stmt->get_result();
  $row = $res->fetch_assoc();
  if (!$row) {
    http_response_code(401);
    echo json_encode(["error" => "Invalid auth token"]);
    exit;
  }
  $email = $row["Email"];
  $stmt2 = $conn->prepare("SELECT ID, Name, Email FROM accountCredentials WHERE Email = ?");
  $stmt2->bind_param("s", $email);
  $stmt2->execute();
  $uRes = $stmt2->get_result();
  $user = $uRes->fetch_assoc();
  if (!$user) {
    http_response_code(401);
    echo json_encode(["error" => "Account not found"]);
    exit;
  }
  return escape_user_data($user);
}
$conn->query("CREATE TABLE IF NOT EXISTS playlists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  name VARCHAR(80) NOT NULL,
  is_public TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)");
$conn->query("CREATE TABLE IF NOT EXISTS playlist_songs (
  playlist_id INT NOT NULL,
  song_id INT NOT NULL,
  position INT NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (playlist_id, song_id)
)");
$user = require_user($conn);
$body = get_json_body();
$name = isset($body["name"]) ? trim((string) $body["name"]) : "";
$is_public = isset($body["is_public"]) ? (int) !!$body["is_public"] : 0;
if ($name === "") {
  http_response_code(400);
  echo json_encode(["error" => "Playlist name is required"]);
  exit;
}
if (mb_strlen($name, 'UTF-8') > 80) {
  http_response_code(400);
  echo json_encode(["error" => "Playlist name max length is 80 characters"]);
  exit;
}
$stmt = $conn->prepare("INSERT INTO playlists (owner_id, name, is_public) VALUES (?, ?, ?)");
$stmt->bind_param("isi", $user["ID"], $name, $is_public);
$ok = $stmt->execute();
if (!$ok) {
  http_response_code(400);
  echo json_encode(["error" => "Could not create playlist", "detail" => $conn->error]);
  exit;
}
$playlist_id = $stmt->insert_id;
echo json_encode([
  "ok" => true,
  "playlist_id" => (int) $playlist_id,
  "name" => htmlspecialchars($name, ENT_QUOTES, 'UTF-8'),
  "is_public" => $is_public,
  "owner_id" => (int) $user["ID"]
]);
?>