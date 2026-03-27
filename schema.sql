-- DDL for Library Management System
-- This file contains the schema definitions for the SQL database

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY, -- Use AUTOINCREMENT in SQLite, AUTO_INCREMENT in MySQL
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user'
);

CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY, -- Use AUTOINCREMENT in SQLite, AUTO_INCREMENT in MySQL
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    quantity INT DEFAULT 1,
    is_issued BOOLEAN DEFAULT FALSE,
    issued_to VARCHAR(50) REFERENCES users(username),
    issued_date TIMESTAMP NULL,
    expected_return_date TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS requests (
    id SERIAL PRIMARY KEY, -- Use AUTOINCREMENT in SQLite, AUTO_INCREMENT in MySQL
    book_id INT REFERENCES books(id),
    username VARCHAR(50) REFERENCES users(username),
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duration_weeks INT NOT NULL,
    expected_return_date TIMESTAMP NULL
);
