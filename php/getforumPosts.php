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

$selectPosts = "SELECT * FROM forumPosts";
$result = $conn->query($selectPosts);

$allPosts = []

if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        if (isset($row['tags'])) {
            $row['tags'] = json_decode($row['tags']);
        }
        $allPosts[] = $row;
    }
}

echo json_encode($allPosts);


?>