<?php
// auth.php: User registration and login logic
session_start();
require_once 'db_connect.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
	$action = $_POST['action'] ?? '';
	$username = trim($_POST['username'] ?? '');
	$password = $_POST['password'] ?? '';

	if ($action === 'register') {
		// Registration logic
		if ($username && $password) {
			// Check if user exists
			$stmt = $pdo->prepare('SELECT user_id FROM users WHERE username = ?');
			$stmt->execute([$username]);
			if ($stmt->fetch()) {
				exit('Username already exists. <a href="../public/index.html" >Go back</a>');
			}
			// Hash password and insert
			$hash = password_hash($password, PASSWORD_DEFAULT);
			$stmt = $pdo->prepare('INSERT INTO users (username, password) VALUES (?, ?)');
			$stmt->execute([$username, $hash]);
			$_SESSION['username'] = $username;
			header('Location: index.html');
			exit();
		}
	} elseif ($action === 'login') {
		// Login logic
		if ($username && $password) {
			$stmt = $pdo->prepare('SELECT user_id, password FROM users WHERE username = ?');
			$stmt->execute([$username]);
			$user = $stmt->fetch();
			if ($user && password_verify($password, $user['password'])) {
				$_SESSION['username'] = $username;
				header('Location: index.html');
				exit();
			} else {
				exit('Invalid credentials. <a href="index.html" >Go back</a>');
			}
		}
	}
}
exit('Invalid request. <a href="index.html" >Go back</a>');
