<?php
header("Access-Control-Allow-Origin: *"); // In production, restrict this to your domain
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// === Database Config ===
$servername = "localhost";
$username = "ikimos";
$password = "50445468";
$dbname = "cse442_2025_fall_team_h_db";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

// === Ensure Table Exists ===
$createTableSQL = "
CREATE TABLE IF NOT EXISTS localRecordings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255),
    title VARCHAR(255),
    description TEXT,
    recording JSON
)";
$conn->query($createTableSQL);

// === Helper for HTML Escaping ===
function h($str) {
    return htmlspecialchars($str ?? '', ENT_QUOTES, 'UTF-8');
}

// === Read Input JSON ===
$input = file_get_contents("php://input");
$data = json_decode($input, true);

if (!$data || !is_array($data)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

// === Extract and Sanitize Inputs ===
$auth_token   = trim($data['userToken'] ?? '');
$title        = trim($data['title'] ?? '');
$description  = trim($data['description'] ?? '');
$recording    = $data['recording'] ?? [];
$recordingId  = isset($data['recordingId']) ? intval($data['recordingId']) : null;

if (empty($auth_token)) {
    http_response_code(401);
    echo json_encode(['error' => 'Missing auth token']);
    exit;
}

// JSON encode recording safely
$recordingJson = json_encode($recording, JSON_UNESCAPED_UNICODE);

// === Authenticate User Token ===
$tokenStmt = $conn->prepare("SELECT Email FROM authTokens WHERE Token = ?");
if (!$tokenStmt) {
    http_response_code(500);
    echo json_encode(['error' => 'Prepare failed: ' . h($conn->error)]);
    exit;
}

$tokenStmt->bind_param("s", $auth_token);
$tokenStmt->execute();
$result = $tokenStmt->get_result();

if ($result && $result->num_rows > 0) {
    $row = $result->fetch_assoc();
    $email = $row['Email'];
} else {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid or missing auth token']);
    $tokenStmt->close();
    $conn->close();
    exit;
}
$tokenStmt->close();

// === Check if this is an UPDATE or INSERT ===
if ($recordingId !== null && $recordingId > 0) {
    // UPDATE existing recording
    
    // First verify ownership
    $checkStmt = $conn->prepare("SELECT id FROM localRecordings WHERE id = ? AND email = ?");
    if (!$checkStmt) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
        $conn->close();
        exit;
    }
    
    $checkStmt->bind_param("is", $recordingId, $email);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows === 0) {
        http_response_code(403);
        echo json_encode(['error' => 'You do not have permission to edit this recording']);
        $checkStmt->close();
        $conn->close();
        exit;
    }
    $checkStmt->close();
    
    // Perform UPDATE
    $updateStmt = $conn->prepare("
        UPDATE localRecordings 
        SET title = ?, description = ?, recording = ?
        WHERE id = ? AND email = ?
    ");
    
    if (!$updateStmt) {
        http_response_code(500);
        echo json_encode(['error' => 'Prepare failed: ' . h($conn->error)]);
        $conn->close();
        exit;
    }
    
    $updateStmt->bind_param("sssis", $title, $description, $recordingJson, $recordingId, $email);
    
    if ($updateStmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Recording updated successfully',
            'recordingId' => $recordingId
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'error' => 'Failed to update recording',
            'details' => h($updateStmt->error)
        ]);
    }
    
    $updateStmt->close();
    
} else {
    // INSERT new recording
    
    $insertStmt = $conn->prepare("
        INSERT INTO localRecordings (email, title, description, recording)
        VALUES (?, ?, ?, ?)
    ");
    
    if (!$insertStmt) {
        http_response_code(500);
        echo json_encode(['error' => 'Prepare failed: ' . h($conn->error)]);
        $conn->close();
        exit;
    }
    
    $insertStmt->bind_param("ssss", $email, $title, $description, $recordingJson);
    
    if ($insertStmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Recording saved successfully',
            'recordingId' => $insertStmt->insert_id
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'error' => 'Failed to save recording',
            'details' => h($insertStmt->error)
        ]);
    }
    
    $insertStmt->close();
}

$conn->close();
?>