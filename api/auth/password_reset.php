
<?php
// Password reset functionality

/**
 * Handles password reset requests
 */
function handleRecuperarPassword() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
        exit;
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['email'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Falta dirección de email']);
        exit;
    }
    
    try {
        $db = getConnection();
        
        // Verificar si existe el email
        $stmt = $db->prepare('SELECT id FROM users WHERE email = ? AND activo = 1');
        $stmt->execute([$data['email']]);
        $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$usuario) {
            // Por seguridad, no indicamos si existe o no
            response(['message' => 'Si la dirección existe, recibirás un email con instrucciones']);
        }
        
        // Generar token de reseteo
        $token = bin2hex(random_bytes(32));
        $expiry = date('Y-m-d H:i:s', strtotime('+24 hours'));
        
        // Guardar token en base de datos
        $stmt = $db->prepare('INSERT INTO reset_tokens (user_id, token, expiry_date) 
                              VALUES (?, ?, ?)');
        $stmt->execute([$usuario['id'], $token, $expiry]);
        
        // En un entorno real, aquí enviaríamos un email con el enlace para resetear
        // Por ahora solo registramos la acción
        logAction($usuario['id'], 'solicitar_reset', 'Solicitud de restablecimiento de contraseña');
        
        response(['message' => 'Si la dirección existe, recibirás un email con instrucciones']);
    } catch (PDOException $e) {
        error_log("Error en recuperación de contraseña: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Error al procesar la solicitud']);
        exit;
    }
}

/**
 * Handles password reset confirmation
 */
function handleResetPassword() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
        exit;
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['token']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Faltan datos obligatorios']);
        exit;
    }
    
    try {
        $db = getConnection();
        
        // Verificar token
        $stmt = $db->prepare('SELECT user_id FROM reset_tokens 
                              WHERE token = ? AND expiry_date > NOW() AND used = 0');
        $stmt->execute([$data['token']]);
        $token = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$token) {
            http_response_code(400);
            echo json_encode(['error' => 'Token inválido o expirado']);
            exit;
        }
        
        // Actualizar contraseña
        $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
        $stmt = $db->prepare('UPDATE users SET password = ? WHERE id = ?');
        $stmt->execute([$hashedPassword, $token['user_id']]);
        
        // Marcar token como usado
        $stmt = $db->prepare('UPDATE reset_tokens SET used = 1 WHERE token = ?');
        $stmt->execute([$data['token']]);
        
        logAction($token['user_id'], 'reset_password', 'Restablecimiento de contraseña exitoso');
        
        response(['message' => 'Contraseña actualizada correctamente']);
    } catch (PDOException $e) {
        error_log("Error en reset de contraseña: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Error al restablecer la contraseña']);
        exit;
    }
}
