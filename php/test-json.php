<?php
header("Content-Type: application/json");

// Read raw POST data
$json = file_get_contents('php://input');

// Decode JSON into associative array
$data = json_decode($json, true);

// Check for JSON errors
if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid JSON: " . json_last_error_msg(),
        "raw_input" => $json
    ]);
    exit;
}

// If JSON is valid, return data for confirmation
echo json_encode([
    "success" => true,
    "received" => $data
]);
