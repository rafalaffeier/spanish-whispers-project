
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
    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    
    // Check for Bearer token
    if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        $token = $matches[1];
        return validateAuthToken($token);
    }
    
    return false;
}
