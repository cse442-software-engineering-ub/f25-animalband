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
    id INT,
    title VARCHAR(255),
    content TEXT,
    tags JSON,
    likesFrom INT,
    author VARCHAR(100),
    authorId INT,
    likeCount INT DEFAULT 0,
    comments INT DEFAULT 0
)");

$json = file_get_contents('php://input');
$data = json_decode($json, true);

$id = data['id'];
$title = data['title'];
$content = data['content'];
$tags = data['tags'];
$likeFrom = data['liked'];
$author = data['author'];
$authorId = data['authorId'];
$likes = data['likes'];
$comments = data['comments'];

$stmt = $conn->prepare("INSERT INTO forumPosts 
    (id, title, content, tags, likesFrom, author, authorID, likeCount, comments) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
);
$stmt->bind_param("isssisiii", $id, $title, $content, $tags, $likeFrom, $author, $authorId, $likes, $comments);

if ($stmt->execute()) {
    echo json_encode(["success" => true, 'message' => 'Post inserted successfully.'])
} else {
    echo json_encode(["success" => false, 'message' => 'Error: ' . $stmt->error]);
}

$stmt->close();

?>