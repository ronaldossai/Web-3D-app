<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set headers for JSON response
header('Content-Type: application/json');

// Check if the form is submitted
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Get form data
    $name = $_POST["name"] ?? '';
    $email = $_POST["email"] ?? '';
    $subject = $_POST["subject"] ?? '';
    $message = $_POST["message"] ?? '';

    // Validate input (basic validation)
    if (empty($name) || empty($email) || empty($subject) || empty($message)) {
        echo json_encode(["status" => "error", "message" => "All fields are required."]);
        exit;
    }

    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(["status" => "error", "message" => "Invalid email format."]);
        exit;
    }

    // Get absolute path for SQLite database
    $dbPath = __DIR__ . '/ctrl+life.db';

    // Connect to SQLite database
    try {
        $db = new SQLite3($dbPath);
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => "Error connecting to database. Please try again later."]);
        exit;
    }

    // Create table if it doesn't exist
    $db->exec("CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // Insert form data into the database
    try {
        $stmt = $db->prepare("INSERT INTO contacts (name, email, subject, message) VALUES (:name, :email, :subject, :message)");
        $stmt->bindValue(':name', $name, SQLITE3_TEXT);
        $stmt->bindValue(':email', $email, SQLITE3_TEXT);
        $stmt->bindValue(':subject', $subject, SQLITE3_TEXT);
        $stmt->bindValue(':message', $message, SQLITE3_TEXT);

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Thank you for contacting us! We'll get back to you soon."]);
        } else {
            echo json_encode(["status" => "error", "message" => "Error submitting your message. Please try again."]);
        }
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => "An error occurred while saving your message. Please try again."]);
    } finally {
        // Close the database connection
        $db->close();
    }
} else {
    // Invalid request
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
}
?>