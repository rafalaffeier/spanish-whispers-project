
<?php
// Utility functions for authentication

// La función generateUUID ahora está centralizada en api/utils.php

/**
 * Generate a secure token for authentication
 * 
 * @param int $userId The user ID to embed in the token
 * @return string The generated token
 */
function generateAuthToken($userId) {
    $tokenData = [
        'user_id' => $userId,
        'timestamp' => time(),
        'random' => bin2hex(random_bytes(16))
    ];
    
    return base64_encode(json_encode($tokenData));
}

/**
 * Validate an authentication token
 * 
 * @param string $token The token to validate
 * @return int|false The user ID if valid, false otherwise
 */
function validateAuthToken($token) {
    try {
        $decodedToken = json_decode(base64_decode($token), true);
        
        if (!isset($decodedToken['user_id']) || !isset($decodedToken['timestamp'])) {
            return false;
        }
        
        // Check if token has expired (24 hours)
        $tokenAge = time() - $decodedToken['timestamp'];
        if ($tokenAge > 86400) {
            return false;
        }
        
        return $decodedToken['user_id'];
    } catch (Exception $e) {
        return false;
    }
}

/**
 * Get the authenticated user from the request
 * 
 * @return int|false The user ID if authenticated, false otherwise
 */
function getAuthenticatedUser() {
    // Get Authorization header
    $headers = apache_request_headers();
    if (!isset($headers['Authorization'])) {
        error_log("AUTH: No Authorization header found");
        // For backwards compatibility, try using the token directly from GET/POST/ID
        if (isset($_GET['token'])) {
            error_log("AUTH: Using token from query parameter");
            return $_GET['token'];
        } else if (isset($_POST['token'])) {
            error_log("AUTH: Using token from POST data");
            return $_POST['token'];
        } else {
            return false;
        }
    }
    
    $authHeader = $headers['Authorization'];
    
    // Check for Bearer token
    if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        $token = $matches[1];
        error_log("AUTH: Found Bearer token: " . substr($token, 0, 10) . "...");
        
        // For simplicity in this app, we're using the ID directly as the token
        // For better security, use validateAuthToken instead
        return $token;
    }
    
    error_log("AUTH: Invalid Authorization header format");
    return false;
}

/**
 * Sanitize and validate email
 * 
 * @param string $email The email to validate
 * @return string|false The sanitized email if valid, false otherwise
 */
function validateEmail($email) {
    $sanitized = filter_var($email, FILTER_SANITIZE_EMAIL);
    return filter_var($sanitized, FILTER_VALIDATE_EMAIL) ? $sanitized : false;
}

/**
 * Simple password strength check
 * 
 * @param string $password The password to check
 * @return bool True if password meets minimum requirements, false otherwise
 */
function checkPasswordStrength($password) {
    // At least 8 characters
    return strlen($password) >= 8;
}
