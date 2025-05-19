
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

require_once __DIR__ . '/auth/utils.php'; // Asegura tener accesso a validateAuthToken()

// FUNCIÓN ACTUALIZADA: aceptar token como id o user_id en tabla empleados
function getAuthenticatedUser() {
    // Obtener headers
    if (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
    } else {
        $headers = [];
        foreach ($_SERVER as $key => $value) {
            if (substr($key, 0, 5) == 'HTTP_') {
                $header = str_replace(' ', '-', ucwords(str_replace('_', ' ', strtolower(substr($key, 5)))));
                $headers[$header] = $value;
            }
        }
    }
    $authorization = $headers['Authorization'] ?? $headers['authorization'] ?? null;
    if (!$authorization) {
        return false;
    }
    if (strpos($authorization, 'Bearer ') !== 0) {
        return false;
    }
    $token = substr($authorization, 7);

    // Compatibilidad: buscar en empleados.id  o empleados.user_id
    try {
        $db = getConnection();

        // Buscar por id (UUID empleado)
        $stmt = $db->prepare('SELECT id FROM empleados WHERE id = ? AND activo = 1');
        $stmt->execute([$token]);
        if ($stmt->rowCount() === 1) {
            return $token;
        }

        // Buscar por user_id (token de autenticación estilo UUID, asociado a empleados.user_id)
        $stmt2 = $db->prepare('SELECT id FROM empleados WHERE user_id = ? AND activo = 1');
        $stmt2->execute([$token]);
        $row = $stmt2->fetch(PDO::FETCH_ASSOC);
        if ($row && isset($row['id'])) {
            return $row['id']; // Devolvemos el id real del empleado
        }
    } catch (PDOException $e) {
        error_log('Error de autenticación (id/user_id): ' . $e->getMessage());
        return false;
    }

    // 2. Intentar token JWT / JSON seguro (para compatibilidad futura)
    $userIdFromToken = validateAuthToken($token);
    if ($userIdFromToken) {
        try {
            $db = getConnection();
            $stmt = $db->prepare('SELECT id FROM empleados WHERE id = ? AND activo = 1');
            $stmt->execute([$userIdFromToken]);
            if ($stmt->rowCount() === 1) {
                return $userIdFromToken;
            }
        } catch (PDOException $e) {
            error_log('Error de autenticación (token seguro): ' . $e->getMessage());
            return false;
        }
    }

    return false;
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
