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

$data = json_decode(file_get_contents("php://input"), true);
$postId = intval($data["postId"] ?? 0);
$action = $data["action"] ?? "";

if (!$postId || !in_array($action, ["like", "unlike"])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid input"]);
    exit;
}

$change = ($action === "like") ? 1 : -1;

// Update likes count
$query = "UPDATE forumPosts SET likeCount = GREATEST(likes + ?, 0) WHERE id = ?";
$stmt = $conn->prepare($query);
$stmt->execute([$change, $postId]);

echo json_encode(["success" => true]);

?>