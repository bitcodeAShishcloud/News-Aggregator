-- SQL schema for News Aggregator

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    preferences TEXT
);

CREATE TABLE articles (
    article_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    source VARCHAR(100),
    url VARCHAR(255),
    published_at DATETIME,
    category VARCHAR(50)
);

CREATE TABLE user_preferences (
    user_id INT,
    category VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
