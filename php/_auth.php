<?php
function get_json_body()
{
    $raw = file_get_contents("php://input");
    if (!$raw)
        return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function require_user($conn)
{
    $body = get_json_body();
    $auth_token = isset($body["auth_token"]) ? trim((string) $body["auth_token"]) : "";
    if ($auth_token === "" && isset($_COOKIE["auth_token"])) {
        $auth_token = trim((string) $_COOKIE["auth_token"]);
    }
    if ($auth_token === "") {
        http_response_code(401);
        echo json_encode(["error" => "Missing auth token"]);
        exit;
    }

    $stmt = $conn->prepare("SELECT Email FROM authTokens WHERE Token=?");
    $stmt->bind_param("s", $auth_token);
    $stmt->execute();
    $res = $stmt->get_result();
    $row = $res->fetch_assoc();
    if (!$row) {
        http_response_code(401);
        echo json_encode(["error" => "Invalid auth token"]);
        exit;
    }

    $email = $row["Email"];
    $stmt2 = $conn->prepare("SELECT ID, Name, Email FROM accountCredentials WHERE Email=?");
    $stmt2->bind_param("s", $email);
    $stmt2->execute();
    $uRes = $stmt2->get_result();
    $user = $uRes->fetch_assoc();
    if (!$user) {
        http_response_code(401);
        echo json_encode(["error" => "Account not found"]);
        exit;
    }

    return $user;
}
