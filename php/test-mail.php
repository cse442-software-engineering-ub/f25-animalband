<?php
$to = "hiwoyo6839@fintehs.com";  // Replace with your email address
$subject = "Test Email from PHP Server";
$message = "This is a test email to check if PHP mail() is working on the server.";
$headers = "From: no-reply@example.com";  // Replace with a valid email address

if (mail($to, $subject, $message, $headers)) {
    echo "Email sent successfully.";
} else {
    echo "Failed to send email.";
}
?>
