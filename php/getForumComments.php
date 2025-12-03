<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$mysqli = new mysqli("localhost", "ikimos", "50445468", "cse442_2025_fall_team_h_db");

if ($mysqli->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed"]);
    exit;
}

$mysqli->set_charset("utf8mb4");

$postId = isset($_GET["postId"]) ? intval($_GET["postId"]) : 0;

if ($postId <= 0) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid postId"]);
    exit;
}

$sql = "SELECT id, postId, parentId, author, authorId, content, likesFrom, likeCount, created_at
        FROM forumComments
        WHERE postId = ?
        ORDER BY likeCount DESC, created_at ASC";

$stmt = $mysqli->prepare($sql);

if (!$stmt) {
    http_response_code(500);
    echo json_encode(["error" => "Database query failed"]);
    exit;
}

$stmt->bind_param("i", $postId);
$stmt->execute();
$res = $stmt->get_result();

$out = [];
while ($row = $res->fetch_assoc()) {
    $likesFrom = $row["likesFrom"] ? json_decode($row["likesFrom"], true) : [];
    if (!is_array($likesFrom))
        $likesFrom = [];

    // 🔽 Decode entities coming from DB (handles &#039; → ')
    $author = html_entity_decode($row["author"] ?? "", ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $content = html_entity_decode($row["content"] ?? "", ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $created = $row["created_at"]; // timestamp, no need to encode

    $out[] = [
        "id" => intval($row["id"]),
        "postId" => intval($row["postId"]),
        "parentId" => $row["parentId"] ? intval($row["parentId"]) : null,
        "author" => $author,
        "authorId" => intval($row["authorId"]),
        "content" => $content,
        "likesFrom" => $likesFrom,
        "likeCount" => intval($row["likeCount"]),
        "created_at" => $created
    ];
}

// keep JSON pretty sane
echo json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

$stmt->close();
$mysqli->close();
?>