<?php
    ini_set('display_errors', 1);
    error_reporting(E_ALL);

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

    // Ensure the verificationCodes table exists, if not, create it
    $createTableSql = "
        CREATE TABLE IF NOT EXISTS verificationCodes (
            email VARCHAR(255) NOT NULL,
            code VARCHAR(6) NOT NULL
        );
    ";
    if (!$conn->query($createTableSql)) {
        echo json_encode(['success' => false, 'message' => 'Error creating table: ' . $conn->error]);
        exit();
    }

    // Check if auth token is set in the cookie
    if (!isset($_COOKIE['auth_token'])) {
        echo json_encode(['success' => false, 'message' => 'Auth token missing']);
        exit();
    }

    $authToken = $_COOKIE['auth_token'];

    // Fetch the email associated with the auth token from the authTokens table
    $sql = "SELECT Email FROM authTokens WHERE Token = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $authToken);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows == 0) {
        echo json_encode(['success' => false, 'message' => 'Invalid auth token']);
        exit();
    }

    $stmt->bind_result($email);
    $stmt->fetch();

    // Generate a six-digit verification code
    $verificationCode = rand(100000, 999999);

    // Insert the verification code into the verificationCodes table
    $insertSql = "INSERT INTO verificationCodes (email, code) VALUES (?, ?)";
    $insertStmt = $conn->prepare($insertSql);
    $insertStmt->bind_param("ss", $email, $verificationCode);

    if ($insertStmt->execute()) {
        // Send the email with the verification code
        $subject = "Your Password Reset Code";
        $message = "Hello, \n\nYour password reset code is: $verificationCode\n\nIf you didn't request this, please ignore this message.";
        $headers = "From: animals@animalband.com"; // Replace with a valid sender email

        if (mail($email, $subject, $message, $headers)) {
            echo json_encode(['success' => true, 'message' => 'Verification code sent to your email']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to send email']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to store verification code']);
    }

    $stmt->close();
    $insertStmt->close();
    $conn->close();
?>
