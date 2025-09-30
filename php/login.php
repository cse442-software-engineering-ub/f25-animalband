<?php
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

    $makeTokenTable = "CREATE TABLE IF NOT EXISTS authTokens (
        `Email` VARCHAR(50),
        `Token` VARCHAR(255)
    )";

    if (!$conn->query($makeTokenTable)) {
        error_log("error making token table");
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

    $email = $data['email'] ?? 'dne';
    $password = $data['password'] ?? 'dne';    
    $hashedPwd = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $conn->prepare("SELECT Password FROM accountCredentials WHERE Email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $passwordResult = $stmt->get_result();
    $stmt->close();

    if ($result->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Invalid user"]);
        exit;
    }

    $row = $result->fetch_assoc();
    $hashedPwd = $row['Password'];

    if (password_verify($password, $hashedPassword)) {
        echo json_encode(["success" => true, "message" => "Successful login"]);
        setcookie("auth_token", $token, [
            'expires' => time() + 3600,
            'path' => '/',
            'secure' => true,
            'httponly' => true,
            'samesite' => 'Strict',
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Incorrect password"]);
    }
?>