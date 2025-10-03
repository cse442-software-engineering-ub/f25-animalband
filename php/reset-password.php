<?php
header("Content-Type: application/json");

// 1. Read raw POST data and decode JSON
$input = json_decode(file_get_contents("php://input"), true);

if (!isset($input['verification_code']) || !isset($input['auth_token'])) {
    echo json_encode(["success" => false, "message" => "Missing required fields."]);
    exit;
}

$verificationCode = $input['verification_code'];
$authToken = $input['auth_token'];

// 2. Database connection settings
$servername = "localhost";
$username = "ikimos";
$password = "50445468";

$conn = new mysqli($servername, $username, $password, "cse442_2025_fall_team_h_db");

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// 3. Check connection
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Database connection failed."]);
    exit;
}

// 4. Get email from authTokens table using the auth token
$stmt = $conn->prepare("SELECT Email FROM authTokens WHERE Token = ?");
$stmt->bind_param("s", $authToken);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Invalid auth token."]);
    $stmt->close();
    $conn->close();
    exit;
}

$row = $result->fetch_assoc();
$email = $row['Email'];
$stmt->close();

// 5. Get verification code for the email
$stmt = $conn->prepare("SELECT code FROM verificationCodes WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "No verification code found for this email."]);
    $stmt->close();
    $conn->close();
    exit;
}

$row = $result->fetch_assoc();
$expectedCode = $row['code'];
$stmt->close();

// 6. Compare the submitted code with the expected one
if ($verificationCode === $expectedCode) {
    echo json_encode(["success" => true, "message" => "Code verified successfully."]);
} else {
    echo json_encode(["success" => false, "message" => "Incorrect verification code."]);
}

$conn->close();
?>
