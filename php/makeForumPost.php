<?php
// Allow cross-origin requests
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$servername = "localhost";
$username = "ikimos";
$password = "50445468";

// Create connection
$conn = new mysqli($servername, $username, $password, "cse442_2025_fall_team_h_db");

if ($conn->connect_error) {
    die(json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error]));
}

// Create table if it doesn't exist
$conn->query("
CREATE TABLE IF NOT EXISTS forumPosts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    content TEXT,
    tags JSON,
    likesFrom JSON,
    author VARCHAR(100),
    authorId INT,
    likeCount INT DEFAULT 0,
    comments INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    recording_id INT DEFAULT NULL
)
");

// Read JSON input
$json = file_get_contents('php://input');
$data = json_decode($json, true);

if ($data === null) {
    echo json_encode(["success" => false, "message" => "Data was null!"]);
    exit;
}

// Sanitize user input to prevent XSS
$title = htmlspecialchars($data['title'] ?? '', ENT_QUOTES, 'UTF-8');
$content = htmlspecialchars($data['content'] ?? '', ENT_QUOTES, 'UTF-8');
$tags = json_encode($data['tags'] ?? []);
$likesFrom = json_encode($data['likesFrom'] ?? []);
$author = htmlspecialchars($data['author'] ?? '', ENT_QUOTES, 'UTF-8');
$authorId = intval($data['authorId'] ?? 0);
$likeCount = intval($data['likes'] ?? 0);
$comments = intval($data['comments'] ?? 0);
$recording_id = isset($data['recording_id']) ? intval($data['recording_id']) : null;

// Prepare statement to prevent SQL injection
$stmt = $conn->prepare("
    INSERT INTO forumPosts 
    (title, content, tags, likesFrom, author, authorId, likeCount, comments, recording_id) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
");

if (!$stmt) {
    echo json_encode(["success" => false, "message" => "Prepare failed: " . $conn->error]);
    exit;
}

$stmt->bind_param(
    "sssssiiii",
    $title,
    $content,
    $tags,
    $likesFrom,
    $author,
    $authorId,
    $likeCount,
    $comments,
    $recording_id
);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Post inserted successfully."]);
} else {
    echo json_encode(["success" => false, "message" => "Error: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
