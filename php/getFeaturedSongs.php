<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

$servername = "localhost";
$username = "ikimos";
$password = "50445468";
$dbname = "cse442_2025_fall_team_h_db";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Database connection failed"]);
    exit;
}
$conn->set_charset("utf8mb4");

// Chooses songs by random. Will update when likes implementd 
$sql = "
  SELECT lr.id, lr.title, lr.description, lr.recording, lr.email,
         COALESCE(ac.Name, SUBSTRING_INDEX(lr.email,'@',1)) AS author
  FROM localRecordings lr
  LEFT JOIN accountCredentials ac ON ac.Email = lr.email
  ORDER BY RAND()
  LIMIT 3
";

$result = $conn->query($sql);

$featuredSongs = [];
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $rec = json_decode($row["recording"], true);
        if (!is_array($rec)) $rec = [];

        $featuredSongs[] = [
            "id" => (int)$row["id"],
            "title" => $row["title"],
            "description" => $row["description"],
            "author" => $row["author"],
            "recording" => $rec
        ];
    }
}

echo json_encode([
    "success" => true,
    "songs" => $featuredSongs
]);

$conn->close();
