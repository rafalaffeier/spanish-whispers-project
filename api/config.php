
<?php
// Configuración global de la API

// Activar reporte de errores para desarrollo
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Configuración de la base de datos
function getConnection() {
    $host = 'localhost';
    $dbname = 'apliumapp';
    $username = 'apliumapp777';
    $password = 'f0qF06*p4';
    
    try {
        $db = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        return $db;
    } catch (PDOException $e) {
        // Capturar error de conexión y devolver mensaje detallado
        $errorInfo = json_encode([
            'error' => 'Error de conexión a la base de datos: ' . $e->getMessage(),
            'code' => $e->getCode(),
            'help' => 'Verifique las credenciales de la base de datos y asegúrese de que el servidor MySQL esté en funcionamiento.'
        ]);
        
        http_response_code(500);
        header('Content-Type: application/json');
        echo $errorInfo;
        exit;
    }
}

// Función para verificar la autenticación del usuario
function getAuthenticatedUser() {
    $headers = apache_request_headers();
    if (!isset($headers['Authorization'])) {
        return false;
    }
    
    $authHeader = $headers['Authorization'];
    if (strpos($authHeader, 'Bearer ') !== 0) {
        return false;
    }
    
    $token = substr($authHeader, 7);
    
    // Por simplicidad, estamos usando el ID como token 
    // En un sistema real, se usaría JWT o similar
    try {
        $db = getConnection();
        $stmt = $db->prepare('SELECT id FROM users WHERE id = ? AND activo = 1');
        $stmt->execute([$token]);
        
        if ($stmt->rowCount() === 1) {
            return $token; // ID del usuario autenticado
        }
        
        return false;
    } catch (PDOException $e) {
        error_log('Error de autenticación: ' . $e->getMessage());
        return false;
    }
}

// Función para registrar acciones en el log
function logAction($user_id, $accion, $detalles = null, $ip = null) {
    try {
        if (!$ip) {
            $ip = $_SERVER['REMOTE_ADDR'];
        }
        
        $db = getConnection();
        $stmt = $db->prepare('INSERT INTO logs (user_id, accion, detalles, ip) VALUES (?, ?, ?, ?)');
        $stmt->execute([$user_id, $accion, $detalles, $ip]);
        
    } catch (PDOException $e) {
        error_log('Error al registrar acción: ' . $e->getMessage());
    }
}

// Función para enviar respuestas JSON
function response($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

// Configuración de CORS - Para permitir peticiones desde cualquier origen
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Max-Age: 86400'); // Cache por 24 horas

// Manejar petición OPTIONS (pre-flight de CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
