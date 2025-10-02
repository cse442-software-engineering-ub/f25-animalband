<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$servername = "localhost";
$username = "ikimos";
$password = "50445468";
$conn = new mysqli($servername, $username, $password, "cse442_2025_fall_team_h_db");

if ($conn->connect_error) {
    die(json_encode(["error" => "DB connection failed"]));
}

if (!isset($_COOKIE["auth_token"])) {
    echo json_encode(["loggedIn" => false]);
    exit;
}

$token = $_COOKIE["auth_token"];

$stmt = $conn->prepare("SELECT accountCredentials.Name, accountCredentials.Email, accountCredentials.ProfilePic
                        FROM authTokens 
                        JOIN accountCredentials ON authTokens.Email = accountCredentials.Email
                        WHERE authTokens.Token = ?");
$stmt->bind_param("s", $token);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    echo json_encode([
        "loggedIn" => true,
        "username" => $row["Name"],
        "email" => $row["Email"],
        "profilePic" => $row["ProfilePic"]
    ]);
} else {
    echo json_encode(["loggedIn" => false]);
}

$stmt->close();
$conn->close();
?>
