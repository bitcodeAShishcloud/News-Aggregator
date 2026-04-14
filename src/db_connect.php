<?php
// db_connect.php: Database connection

// === InfinityFree Database Credentials ===
// After creating your database in InfinityFree, update the following:
// $host: Use the MySQL hostname from the control panel (e.g., sqlXXX.infinityfree.com)
// $db:   Your database name (e.g., epiz_12345678_dbname)
// $user: Your database username (e.g., epiz_12345678)
// $pass: Your database password (set in the control panel)
$host = 'sql100.infinityfree.com'; // Replace with your InfinityFree MySQL hostname
$db   = 'if0_41664096_db';   // Replace with your InfinityFree database name
$user = 'if0_41664096';          // Replace with your InfinityFree username
$pass = 'umODFkNT4cAw';       // Replace with your InfinityFree DB password
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (PDOException $e) {
    exit('Database connection failed: ' . $e->getMessage());
}
