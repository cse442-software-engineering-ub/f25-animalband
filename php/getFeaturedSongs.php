<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$servername = "localhost";
$username = "ikimos";
$password = "50445468";
$dbname = "cse442_2025_fall_team_h_db";
$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Database connection failed"]);
    exit;
}

$conn->set_charset("utf8mb4");

// Try to get top songs by likes from forumPosts
$sql = "
  SELECT lr.id, lr.title, lr.description, lr.recording, lr.email,
         COALESCE(ac.Name, SUBSTRING_INDEX(lr.email,'@',1)) AS author,
         fp.likeCount
  FROM forumPosts fp
  INNER JOIN localRecordings lr ON fp.recording_id = lr.id
  LEFT JOIN accountCredentials ac ON ac.Email = lr.email
  WHERE fp.recording_id IS NOT NULL
  ORDER BY fp.likeCount DESC
  LIMIT 3
";

$stmt = $conn->prepare($sql);
if (!$stmt) {
    // If query fails, fall back to random selection
    $sql_fallback = "
      SELECT lr.id, lr.title, lr.description, lr.recording, lr.email,
             COALESCE(ac.Name, SUBSTRING_INDEX(lr.email,'@',1)) AS author
      FROM localRecordings lr
      LEFT JOIN accountCredentials ac ON ac.Email = lr.email
      ORDER BY RAND()
      LIMIT 3
    ";
    
    $stmt = $conn->prepare($sql_fallback);
    if (!$stmt) {
        http_response_code(500);
        echo json_encode([
            "success" => false, 
            "error" => "Database query failed",
            "sql_error" => $conn->error
        ]);
        exit;
    }
}

$stmt->execute();
$result = $stmt->get_result();

$featuredSongs = [];
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $rec = json_decode($row["recording"], true);
        if (!is_array($rec)) $rec = [];
        
        $song = [
            "id" => (int)$row["id"],
            "title" => htmlspecialchars($row["title"], ENT_QUOTES, 'UTF-8'),
            "description" => htmlspecialchars($row["description"], ENT_QUOTES, 'UTF-8'),
            "author" => htmlspecialchars($row["author"], ENT_QUOTES, 'UTF-8'),
            "recording" => $rec
        ];
        
        // Add likes if available
        if (isset($row["likeCount"])) {
            $song["likes"] = (int)$row["likeCount"];
        }
        
        $featuredSongs[] = $song;
    }
}

// If no songs found from forumPosts, try getting any songs
if (count($featuredSongs) === 0) {
    $sql_any = "
      SELECT lr.id, lr.title, lr.description, lr.recording, lr.email,
             COALESCE(ac.Name, SUBSTRING_INDEX(lr.email,'@',1)) AS author
      FROM localRecordings lr
      LEFT JOIN accountCredentials ac ON ac.Email = lr.email
      ORDER BY RAND()
      LIMIT 3
    ";
    
    $stmt2 = $conn->prepare($sql_any);
    if ($stmt2) {
        $stmt2->execute();
        $result2 = $stmt2->get_result();
        
        if ($result2 && $result2->num_rows > 0) {
            while ($row = $result2->fetch_assoc()) {
                $rec = json_decode($row["recording"], true);
                if (!is_array($rec)) $rec = [];
                
                $featuredSongs[] = [
                    "id" => (int)$row["id"],
                    "title" => htmlspecialchars($row["title"], ENT_QUOTES, 'UTF-8'),
                    "description" => htmlspecialchars($row["description"], ENT_QUOTES, 'UTF-8'),
                    "author" => htmlspecialchars($row["author"], ENT_QUOTES, 'UTF-8'),
                    "recording" => $rec
                ];
            }
        }
        $stmt2->close();
    }
}

echo json_encode([
    "success" => true,
    "songs" => $featuredSongs
], JSON_UNESCAPED_UNICODE);

$stmt->close();
$conn->close();
?>