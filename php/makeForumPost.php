<?php
// Allow cross-origin requests
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

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
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
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

// Authenticate user
$author = "";
$authorId = 0;

if (!isset($_COOKIE["auth_token"])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Authentication required"]);
    $conn->close();
    exit;
}

$token = trim((string)$_COOKIE["auth_token"]);

if (empty($token)) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Invalid authentication"]);
    $conn->close();
    exit;
}

// Get author info from auth token (server-side, not client-provided)
$authStmt = $conn->prepare("
    SELECT a.ID, a.Name
    FROM authTokens t
    JOIN accountCredentials a ON a.Email = t.Email
    WHERE t.Token = ?
    LIMIT 1
");

if (!$authStmt) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database query failed"]);
    $conn->close();
    exit;
}

$authStmt->bind_param("s", $token);
$authStmt->execute();
$res = $authStmt->get_result();

if ($row = $res->fetch_assoc()) {
    $authorId = (int)$row["ID"];
    $author = $row["Name"];
} else {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Invalid authentication"]);
    $authStmt->close();
    $conn->close();
    exit;
}
$authStmt->close();

// Parse request body
$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid request data"]);
    $conn->close();
    exit;
}

// Validate and sanitize inputs
$title = isset($data['title']) ? trim((string)$data['title']) : '';
$content = isset($data['content']) ? trim((string)$data['content']) : '';
$tagsArray = isset($data['tags']) && is_array($data['tags']) ? $data['tags'] : [];

// Validation
if (empty($title)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Title is required"]);
    $conn->close();
    exit;
}

if (mb_strlen($title, 'UTF-8') > 255) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Title exceeds 255 characters"]);
    $conn->close();
    exit;
}

if (empty($content)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Content is required"]);
    $conn->close();
    exit;
}

if (mb_strlen($content, 'UTF-8') > 10000) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Content exceeds 10000 characters"]);
    $conn->close();
    exit;
}

// New posts start with no likes or comments - server-controlled
$tags = json_encode($tagsArray);
$likesFrom = json_encode([]);
$likeCount = 0;
$comments = 0;

$stmt = $conn->prepare("INSERT INTO forumPosts 
    (title, content, tags, likesFrom, author, authorId, likeCount, comments) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
);

if (!$stmt) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database query failed"]);
    $conn->close();
    exit;
}

$stmt->bind_param("sssssiii", $title, $content, $tags, $likesFrom, $author, $authorId, $likeCount, $comments);

if ($stmt->execute()) {
    $insertId = $stmt->insert_id;
    echo json_encode([
        "success" => true,
        "message" => "Post created successfully",
        "postId" => (int)$insertId
    ]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to create post"]);
}

$stmt->close();
$conn->close();
?>