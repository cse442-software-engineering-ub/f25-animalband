<?php
    // Remove these in production - security risk
    // ini_set('display_errors', 1);
    // error_reporting(E_ALL);
    
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Headers: Content-Type");
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    header("Content-Type: application/json");
    
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
        echo json_encode(['success' => false, 'message' => 'Database connection failed']);
        exit;
    }
    
    // Ensure the verificationCodes table exists with expiration
    $createTableSql = "
        CREATE TABLE IF NOT EXISTS verificationCodes (
            email VARCHAR(255) NOT NULL,
            code VARCHAR(6) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX(email),
            INDEX(created_at)
        );
    ";
    if (!$conn->query($createTableSql)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error']);
        exit;
    }
    
    // Check if auth token is set in the cookie
    if (!isset($_COOKIE['auth_token'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Auth token missing']);
        exit;
    }
    
    $authToken = trim((string) $_COOKIE['auth_token']);
    
    // Fetch the email associated with the auth token from the authTokens table
    $sql = "SELECT Email FROM authTokens WHERE Token = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $authToken);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows == 0) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid auth token']);
        exit;
    }
    
    $row = $result->fetch_assoc();
    $email = $row['Email'];
    $stmt->close();
    
    // Validate email format to prevent header injection
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid email address']);
        exit;
    }
    
    // Delete old verification codes for this email
    $deleteSql = "DELETE FROM verificationCodes WHERE email = ?";
    $deleteStmt = $conn->prepare($deleteSql);
    $deleteStmt->bind_param("s", $email);
    $deleteStmt->execute();
    $deleteStmt->close();
    
    // Generate a six-digit verification code
    $verificationCode = str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
    
    // Insert the verification code into the verificationCodes table
    $insertSql = "INSERT INTO verificationCodes (email, code) VALUES (?, ?)";
    $insertStmt = $conn->prepare($insertSql);
    $insertStmt->bind_param("ss", $email, $verificationCode);
    
    if ($insertStmt->execute()) {
        // Sanitize email content
        $safeEmail = htmlspecialchars($email, ENT_QUOTES, 'UTF-8');
        $safeCode = htmlspecialchars($verificationCode, ENT_QUOTES, 'UTF-8');
        
        // Send the email with the verification code
        $subject = "Your Password Reset Code";
        $message = "Hello,\n\nYour password reset code is: $safeCode\n\nThis code will expire in 15 minutes.\n\nIf you didn't request this, please ignore this message.";
        $headers = "From: animals@animalband.com\r\n";
        $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
        
        if (mail($email, $subject, $message, $headers)) {
            echo json_encode(['success' => true, 'message' => 'Verification code sent to your email']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to send email']);
        }
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to store verification code']);
    }
    
    $insertStmt->close();
    $conn->close();
?>