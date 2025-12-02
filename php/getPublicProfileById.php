<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$servername = "localhost";
$username = "ikimos";
$password = "50445468";
$dbname = "cse442_2025_fall_team_h_db";
$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Database connection failed"]);
    exit;
}

$conn->set_charset("utf8mb4");

// Validate input
if (!isset($_GET["id"])) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Missing id"]);
    exit;
}

$userId = (int) $_GET["id"];
if ($userId <= 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Invalid id"]);
    exit;
}

// Fetch public profile info
$stmt = $conn->prepare("
    SELECT ID, Name, Email, profilePic
    FROM accountCredentials
    WHERE ID = ?
    LIMIT 1
");

$stmt->bind_param("i", $userId);
$stmt->execute();
$res = $stmt->get_result();
$user = $res->fetch_assoc();
$stmt->close();

if (!$user) {
    echo json_encode(["success" => false, "error" => "User not found"]);
    exit;
}

// Build base public info
$publicUser = [
    "id" => (int) $user["ID"],
    "username" => $user["Name"],
    "profilePic" => $user["profilePic"],
];

// --- Fetch post count ---
$stmt = $conn->prepare("SELECT COUNT(*) AS cnt FROM forumPosts WHERE authorId = ?");
$stmt->bind_param("i", $userId);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();
$postCount = (int) ($row["cnt"] ?? 0);
$stmt->close();

// --- Fetch total likes on their posts ---
$stmt = $conn->prepare("SELECT COALESCE(SUM(likeCount),0) AS likes FROM forumPosts WHERE authorId = ?");
$stmt->bind_param("i", $userId);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();
$likeCount = (int) ($row["likes"] ?? 0);
$stmt->close();

// --- Fetch recording count ---
$stmt = $conn->prepare("SELECT COUNT(*) AS cnt FROM localRecordings WHERE email = ?");
$stmt->bind_param("s", $user["Email"]);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();
$recordingCount = (int) ($row["cnt"] ?? 0);
$stmt->close();

echo json_encode([
    "success" => true,
    "user" => $publicUser,
    "stats" => [
        "postCount" => $postCount,
        "likeCount" => $likeCount,
        "recordingCount" => $recordingCount
    ]
]);

$conn->close();
?>