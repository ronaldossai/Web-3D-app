<?php
// Server and DB connection parameters
$servername = "localhost";
$rootuser = "root";
$db = "ctrl+life";
$rootPassword = "";

// Create connection
$conn = new mysqli($servername, $rootuser, $rootPassword, $db);

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Check if the form is submitted
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Get form data
    $name = $_POST["name"];
    $email = $_POST["email"];
    $subject = $_POST["subject"];
    $message = $_POST["message"];

    // Validate input (basic validation)
    if (empty($name) || empty($email) || empty($subject) || empty($message)) {
        die("All fields are required.");
    }

    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        die("Invalid email format.");
    }

    // Connect to SQLite database
    try {
        $db = new SQLite3('contact.db');
    } catch (Exception $e) {
        die("Error connecting to database: " . $e->getMessage());
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
    $stmt = $db->prepare("INSERT INTO contacts (name, email, subject, message) VALUES (:name, :email, :subject, :message)");
    $stmt->bindValue(':name', $name, SQLITE3_TEXT);
    $stmt->bindValue(':email', $email, SQLITE3_TEXT);
    $stmt->bindValue(':subject', $subject, SQLITE3_TEXT);
    $stmt->bindValue(':message', $message, SQLITE3_TEXT);

    if ($stmt->execute()) {
        // Success message
        echo json_encode(["status" => "success", "message" => "Thank you for contacting us! We'll get back to you soon."]);
    } else {
        // Error message
        echo json_encode(["status" => "error", "message" => "Error submitting your message. Please try again."]);
    }

    // Close the database connection
    $db->close();
} else {
    // Invalid request
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
}
?>