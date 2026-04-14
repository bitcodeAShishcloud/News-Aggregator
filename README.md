# News Aggregator

News Aggregator is a small PHP-based web app that fetches technology news from NewsAPI, stores articles in MySQL, and displays them in a simple browser UI with login and registration forms.

## Live Demo

https://news-aggregator.rf.gd

## Features

- Pulls the latest technology news from NewsAPI
- Stores articles in a MySQL database to avoid duplicates
- Displays a basic feed in the browser
- Supports user registration and login with password hashing

## Project Structure

- `public/index.html` - Frontend entry point
- `public/app.js` - Client-side navigation and feed rendering
- `public/styles.css` - Page styling
- `src/fetch_news.php` - Fetches articles from NewsAPI and saves them to the database
- `src/feed.php` - Returns stored articles as JSON
- `src/auth.php` - Handles registration and login
- `src/db_connect.php` - Creates the MySQL connection
- `src/db.sql` - Database schema

## Requirements

- PHP 7.4 or newer
- MySQL or MariaDB
- cURL enabled in PHP
- A valid NewsAPI key

## Setup

1. Create a MySQL database and import `src/db.sql`.
2. Update the database credentials in `src/db_connect.php`.
3. Update the NewsAPI key in `src/fetch_news.php`.
4. Serve the `public/` directory and make sure PHP can access the `src/` files.

## Usage

1. Open `public/index.html` in a browser through your PHP server.
2. Use the Home tab to view the news feed.
3. Use the Register and Login forms to create or authenticate a user.
4. Run `src/fetch_news.php` periodically to refresh the stored articles.

## Database Tables

- `users` stores registered users and hashed passwords
- `articles` stores fetched news articles
- `user_preferences` is available for future category preference handling

## Notes

- The frontend currently loads articles from `feed.php` and renders them client-side.
- If you deploy the app, replace any placeholder credentials with your own values before publishing.
