<?php
ob_clean();
header('Content-Type: application/json; charset=utf-8');

require_once 'db_connect.php';

$articles = [];

$sql = 'SELECT title, content, source, url, published_at, category FROM articles ORDER BY published_at DESC LIMIT 20';
$stmt = $pdo->query($sql);

while ($row = $stmt->fetch()) {
    $articles[] = $row;
}

echo json_encode($articles, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
exit;
?>