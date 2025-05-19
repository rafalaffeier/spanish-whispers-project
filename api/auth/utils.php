
<?php
// Utility functions for authentication

// La función generateUUID ahora está centralizada en api/utils.php
// *** ELIMINADA LA FUNCIÓN DUPLICADA generateUUID() ***

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

// *** ELIMINADO: función duplicada getAuthenticatedUser() aquí ***


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

