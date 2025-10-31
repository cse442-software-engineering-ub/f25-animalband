<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$servername = "localhost";
$username = "ikimos";
$password = "50445468";
$dbname = "cse442_2025_fall_team_h_db";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "DB Connection failed: ".$conn->connect_error]);
    exit;
}

// Read JSON input
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    echo json_encode(["success" => false, "message" => "Invalid input"]);
    exit;
}

// Sanitize inputs
$title = $input['title'] ?? '';
$content = $input['content'] ?? '';
$author = $input['author'] ?? '';
$authorId = intval($input['authorId'] ?? 0);
$recordingId = isset($input['recordingId']) && $input['recordingId'] !== null ? intval($input['recordingId']) : null;
$tags = json_encode($input['tags'] ?? []);
$likesFrom = json_encode($input['likesFrom'] ?? []);
$likeCount = count($input['likesFrom'] ?? []);

// Use prepared statement
$stmt = $conn->prepare("INSERT INTO forumPosts (title, content, tags, likesFrom, author, authorId, recording_id, likeCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
$stmt->bind_param("sssssiis", $title, $content, $tags, $likesFrom, $author, $authorId, $recordingId, $likeCount);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "postId" => $stmt->insert_id]);
} else {
    echo json_encode(["success" => false, "message" => "Insert failed: ".$stmt->error]);
}

$stmt->close();
$conn->close();
?>
