<?php
// Allow cross-origin requests
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");

$servername = "localhost";
$username = "ikimos";
$password = "50445468";

$conn = new mysqli($servername, $username, $password, "cse442_2025_fall_team_h_db");

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$conn->query("CREATE TABLE IF NOT EXISTS forumPosts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    content TEXT,
    tags JSON,
    likesFrom JSON,
    author VARCHAR(100),
    authorId INT,
    likeCount INT DEFAULT 0,
    comments INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

$selectPosts = "SELECT id, title, content, tags, likesFrom, author, authorId, likeCount, comments, created_at
                FROM forumPosts
                ORDER BY created_at DESC, id DESC";
$result = $conn->query($selectPosts);

$allPosts = [];

if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        // if (isset($row['tags'])) {
        //     $row['tags'] = json_decode($row['tags']);
        // }
        // if (isset($row['likesFrom'])) {
        //     $row['likesFrom'] = json_decode($row['likesFrom']);
        // }
        $row['tags'] = isset($row['tags']) ? (json_decode($row['tags'], true) ?: []) : [];
        $row['likesFrom'] = isset($row['likesFrom']) ? (json_decode($row['likesFrom'], true) ?: []) : [];

        $allPosts[] = $row;
    }
}

echo json_encode($allPosts);


?>