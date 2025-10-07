<?php
// Allow cross-origin requests
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$servername = "localhost";
$username = "ikimos";
$password = "50445468";

$conn = new mysqli($servername, $username, $password, "cse442_2025_fall_team_h_db");

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Adjust your table schema once (do this once manually or in a migration script):
$conn->query("CREATE TABLE IF NOT EXISTS forumPosts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    content TEXT,
    tags JSON,
    likesFrom TINYINT(1),
    author VARCHAR(100),
    authorId INT,
    likeCount INT DEFAULT 0,
    comments INT DEFAULT 0
)");

$json = file_get_contents('php://input');
$data = json_decode($json, true);

if ($data === null) {
    echo json_encode(["success" => false, "message" => "Invalid JSON"]);
    exit;
}

$title = $data['title'] ?? '';
$content = $data['content'] ?? '';
$tags = json_encode($data['tags'] ?? []);
$likesFrom = isset($data['liked']) ? ($data['liked'] ? 1 : 0) : 0;
$author = $data['author'] ?? '';
$authorId = $data['authorId'] ?? 0;
$likeCount = $data['likes'] ?? 0;
$comments = $data['comments'] ?? 0;

$stmt = $conn->prepare("INSERT INTO forumPosts 
    (title, content, tags, likesFrom, author, authorId, likeCount, comments) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
);

if (!$stmt) {
    echo json_encode(["success" => false, "message" => "Prepare failed: " . $conn->error]);
    exit;
}

// bind_param types:
// s = string, i = int
$stmt->bind_param("sssisiii", $title, $content, $tags, $likesFrom, $author, $authorId, $likeCount, $comments);

if ($stmt->execute()) {
    echo json_encode(["success" => true, 'message' => 'Post inserted successfully.']);
} else {
    echo json_encode(["success" => false, 'message' => 'Error: ' . $stmt->error]);
}

$stmt->close();
?>