<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");

$servername = "localhost";
$username = "ikimos";
$password = "50445468";
$dbname = "cse442_2025_fall_team_h_db";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    die(json_encode(["error" => "DB connection failed"]));
}

// Ensure table exists
$conn->query("CREATE TABLE IF NOT EXISTS forumPosts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    content TEXT,
    tags JSON,
    likesFrom JSON,
    author VARCHAR(100),
    authorId INT,
    recording_id INT DEFAULT NULL,
    likeCount INT DEFAULT 0,
    comments INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

$result = $conn->query("SELECT * FROM forumPosts ORDER BY created_at DESC, id DESC");
$posts = [];

while ($row = $result->fetch_assoc()) {
    $row['tags'] = isset($row['tags']) ? json_decode($row['tags'], true) : [];
    $row['likesFrom'] = isset($row['likesFrom']) ? json_decode($row['likesFrom'], true) : [];
    $posts[] = $row;
}

echo json_encode($posts);
$conn->close();
?>
