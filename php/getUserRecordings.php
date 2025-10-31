<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// DB connection
$servername = "localhost";
$username = "ikimos";
$password = "50445468";
$dbname = "cse442_2025_fall_team_h_db";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) { http_response_code(500); echo json_encode(["error"=>"DB error"]); exit; }

// Get token
$token = $_COOKIE['auth_token'] ?? null;
if (!$token) { http_response_code(401); echo json_encode(["error"=>"Not logged in"]); exit; }

// Get email
$stmt = $conn->prepare("SELECT Email FROM authTokens WHERE Token=?");
$stmt->bind_param("s",$token);
$stmt->execute();
$res = $stmt->get_result();
$stmt->close();
if ($res->num_rows===0) { http_response_code(401); echo json_encode(["error"=>"Invalid token"]); exit; }
$email = $res->fetch_assoc()['Email'];

// Fetch recordings
$stmt = $conn->prepare("SELECT id, title, recording FROM localRecordings WHERE email=? ORDER BY id DESC");
$stmt->bind_param("s",$email);
$stmt->execute();
$res = $stmt->get_result();
$stmt->close();

$recordings = [];
while($row=$res->fetch_assoc()){
    $recordings[] = [
        "id" => (int)$row['id'],
        "title" => $row['title'] ?: "Recording #{$row['id']}",
        "recording" => json_decode($row['recording'], true) // the sequence of keys/times
    ];
}

echo json_encode(["recordings"=>$recordings]);
$conn->close();
exit;
?>
