<?php
require_once 'db_connect.php';

$apiKey = 'c7dee7b86c0a47428ccd176c673ee100';
$url = 'https://newsapi.org/v2/everything?q=technology&pageSize=10&sortBy=publishedAt&apiKey=' . $apiKey;

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

// ✅ ADD THIS LINE (IMPORTANT)
curl_setopt($ch, CURLOPT_USERAGENT, 'NewsAggregatorApp/1.0 (agupta38160@gmail.com) ');

$json = curl_exec($ch);

if (curl_errno($ch)) {
    die('Curl error: ' . curl_error($ch));
}

curl_close($ch);

$data = json_decode($json, true);

if (!isset($data['articles'])) {
    die('No articles found or API error.');
}

$inserted = 0;

foreach ($data['articles'] as $article) {
    $title = $article['title'] ?? '';
    $content = $article['description'] ?? '';
    $source = $article['source']['name'] ?? '';
    $urlA = $article['url'] ?? '';
    $published_at = $article['publishedAt'] ?? null;
    $category = '';

    if (!$title || !$urlA) continue;

    // Avoid duplicates
    $stmt = $pdo->prepare('SELECT article_id FROM articles WHERE url = ?');
    $stmt->execute([$urlA]);
    if ($stmt->fetch()) continue;

    $stmt = $pdo->prepare('INSERT INTO articles (title, content, source, url, published_at, category) VALUES (?, ?, ?, ?, ?, ?)');
    $stmt->execute([$title, $content, $source, $urlA, $published_at, $category]);

    $inserted++;
}

echo "$inserted articles inserted.";
?>