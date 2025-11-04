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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    recording_id INT DEFAULT NULL
)");

$json = file_get_contents('php://input');
$data = json_decode($json, true);

if ($data === null) {
    echo json_encode(["success" => false, "message" => "Data was null!"]);
    exit;
}

$title = $data['title'] ?? '';
$content = $data['content'] ?? '';
$tags = json_encode($data['tags'] ?? []);
$likesFrom = json_encode($data['likesFrom'] ?? []);;
$author = $data['author'] ?? '';
$authorId = $data['authorId'] ?? 0;
$likeCount = $data['likes'] ?? 0;
$comments = $data['comments'] ?? 0;
$recording_id = $data['recording_id'] ?? null;

$stmt = $conn->prepare("INSERT INTO forumPosts 
    (title, content, tags, likesFrom, author, authorId, likeCount, comments, recording_id) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
);

if (!$stmt) {
    echo json_encode(["success" => false, "message" => "Prepare failed: " . $conn->error]);
    exit;
}

$stmt->bind_param("sssssiiii", $title, $content, $tags, $likesFrom, $author, $authorId, $likeCount, $comments, $recording_id);

if ($stmt->execute()) {
    echo json_encode(["success" => true, 'message' => 'Post inserted successfully.']);
} else {
    echo json_encode(["success" => false, 'message' => 'Error: ' . $stmt->error]);
}

$stmt->close();
?>