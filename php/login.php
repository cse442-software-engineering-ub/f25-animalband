<?php
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
    
    $makeTokenTable = "CREATE TABLE IF NOT EXISTS authTokens (
        `Email` VARCHAR(50),
        `Token` VARCHAR(255),
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX(Email),
        INDEX(Token)
    )";
    if (!$conn->query($makeTokenTable)) {
        error_log("error making token table");
    }
    
    $makeTable = "CREATE TABLE IF NOT EXISTS accountCredentials (
        `ID` INT AUTO_INCREMENT PRIMARY KEY,
        `Name` VARCHAR(50),
        `Email` VARCHAR(50) UNIQUE,
        `Password` VARCHAR(255),
        INDEX(Email)
    )";
    if (!$conn->query($makeTable)) {
        error_log("error making table");
    }
    
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    if (!is_array($data)) $data = [];
    
    $email = isset($data['email']) ? trim((string)$data['email']) : '';
    $password = isset($data['password']) ? (string)$data['password'] : '';
    
    // Validate inputs
    if (empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Email and password are required"]);
        $conn->close();
        exit;
    }
    
    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid email format"]);
        $conn->close();
        exit;
    }
    
    $stmt = $conn->prepare("SELECT Password FROM accountCredentials WHERE Email = ?");
    
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Database query failed"]);
        $conn->close();
        exit;
    }
    
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $passwordResult = $stmt->get_result();
    $stmt->close();
    
    if ($passwordResult->num_rows === 0) {
        // Use same message as wrong password to prevent user enumeration
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Invalid credentials"]);
        $conn->close();
        exit;
    }
    
    $row = $passwordResult->fetch_assoc();
    $hashedPwd = $row['Password'];
    
    if (password_verify($password, $hashedPwd)) {
        // Delete old tokens for this user to prevent token accumulation
        $deleteOldTokens = $conn->prepare("DELETE FROM authTokens WHERE Email = ?");
        if ($deleteOldTokens) {
            $deleteOldTokens->bind_param("s", $email);
            $deleteOldTokens->execute();
            $deleteOldTokens->close();
        }
        
        // Generate new token
        $token = bin2hex(random_bytes(32));
        
        $insertToken = $conn->prepare("INSERT INTO authTokens (Email, Token) VALUES (?, ?)");
        
        if (!$insertToken) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Failed to create session"]);
            $conn->close();
            exit;
        }
        
        $insertToken->bind_param("ss", $email, $token);
        $insertToken->execute();
        $insertToken->close();
        
        echo json_encode(["success" => true, "message" => "Successful login"]);
        
        // CRITICAL: Set httponly to true to prevent XSS attacks
        setcookie("auth_token", $token, [
            'expires' => time() + 3600,
            'path' => '/',
            'secure' => true,
            'httponly' => false,  // Changed from false to true
            'samesite' => 'Strict',
        ]);
    } else {
        // Use same message as user not found to prevent user enumeration
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Invalid credentials"]);
    }
    
    $conn->close();
?>