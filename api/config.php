
<?php
// Configuración de la base de datos
define('DB_HOST', 'localhost'); // Cambiar por tu host de MySQL en Plesk
define('DB_NAME', 'control_jornada');
define('DB_USER', ''); // Añadir tu usuario de MySQL
define('DB_PASSWORD', ''); // Añadir tu contraseña de MySQL

// Zona horaria
date_default_timezone_set('Europe/Madrid');

// Cabeceras CORS para permitir acceso desde el frontend
header('Access-Control-Allow-Origin: *'); // En producción, especificar el origen exacto
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Si es una solicitud OPTIONS, terminar aquí (para CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Función para conectar a la base de datos
function getConnection() {
    try {
        $conn = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
            DB_USER,
            DB_PASSWORD,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
        return $conn;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error de conexión a la base de datos: ' . $e->getMessage()]);
        exit;
    }
}

// Función para generar respuesta JSON
function response($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

// Función para obtener el usuario autenticado (básica)
function getAuthenticatedUser() {
    // Implementación básica. En producción, usar JWT o similar
    if (!isset($_SERVER['HTTP_AUTHORIZATION'])) {
        return null;
    }
    
    $auth = $_SERVER['HTTP_AUTHORIZATION'];
    if (strpos($auth, 'Bearer ') !== 0) {
        return null;
    }
    
    $token = substr($auth, 7);
    // Aquí implementarías la validación del token
    // Por ahora, simplemente extraemos el ID de usuario (simulado)
    $userId = validateToken($token);
    
    return $userId;
}

// Función simulada de validación de token
function validateToken($token) {
    // En un sistema real, verificarías el token JWT o similar
    // Por ahora, simulamos que el token es el ID del usuario
    return $token;
}

// Función para registrar log
function logAction($empleadoId, $accion, $detalles = '') {
    try {
        $db = getConnection();
        $stmt = $db->prepare('INSERT INTO logs (empleado_id, accion, detalles, ip) VALUES (?, ?, ?, ?)');
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $stmt->execute([$empleadoId, $accion, $detalles, $ip]);
    } catch (Exception $e) {
        // Log silencioso, no interrumpir flujo principal
        error_log("Error al guardar log: " . $e->getMessage());
    }
}
