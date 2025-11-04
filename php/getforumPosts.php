<?php
// Allow cross-origin requests
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$servername = "localhost";
$username = "ikimos";
$password = "50445468";
$conn = new mysqli($servername, $username, $password, "cse442_2025_fall_team_h_db");

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed"]);
    exit;
}

$conn->set_charset("utf8mb4");

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

$stmt = $conn->prepare($selectPosts);

if (!$stmt) {
    http_response_code(500);
    echo json_encode(["error" => "Database query failed"]);
    exit;
}

$stmt->execute();
$result = $stmt->get_result();

$allPosts = [];
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $tags = isset($row['tags']) ? json_decode($row['tags'], true) : [];
        if (!is_array($tags)) $tags = [];
        
        $likesFrom = isset($row['likesFrom']) ? json_decode($row['likesFrom'], true) : [];
        if (!is_array($likesFrom)) $likesFrom = [];
        
        $allPosts[] = [
            'id' => (int)$row['id'],
            'title' => htmlspecialchars($row['title'], ENT_QUOTES, 'UTF-8'),
            'content' => htmlspecialchars($row['content'], ENT_QUOTES, 'UTF-8'),
            'tags' => $tags,
            'likesFrom' => $likesFrom,
            'author' => htmlspecialchars($row['author'], ENT_QUOTES, 'UTF-8'),
            'authorId' => (int)$row['authorId'],
            'likeCount' => (int)$row['likeCount'],
            'comments' => (int)$row['comments'],
            'created_at' => htmlspecialchars($row['created_at'], ENT_QUOTES, 'UTF-8')
        ];
    }
}

echo json_encode($allPosts, JSON_UNESCAPED_UNICODE);

$stmt->close();
$conn->close();
?>