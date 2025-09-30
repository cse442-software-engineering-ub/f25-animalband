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

    $makeTable = "CREATE TABLE IF NOT EXISTS accountCredentials (
        `Name` VARCHAR(50),
        `Email` VARCHAR(50),
        `Password` VARCHAR(255) 
    )";

    if (!$conn->query($makeTable)) {
        error_log("error making table");
    }

    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    $username = $data['username'] ?? 'dne';
    $email = $data['email'] ?? 'dne';
    $password = $data['password'] ?? 'dne';

    error_log("recv user: $username");
    error_log("recv email: $email");
    error_log("recv pwd: $password");

    $hashedPwd = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $conn->prepare("INSERT INTO accountCredentials (Name, Email, Password) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $username, $email, $hashedPwd);

    if ($stmt->execute()) {
        echo json_encode(['message' => 'User registered successfully']);
    } else {
        // Handle duplicate username/email or other errors
        echo json_encode(['message' => 'Error: ' . $stmt->error]);
    }

    $stmt->close();
    $conn->close();
?>
