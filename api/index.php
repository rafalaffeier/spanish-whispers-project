
<?php
// API RESTful principal
require_once 'config.php';

// Verificar auth para rutas protegidas
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$segments = explode('/', trim($path, '/'));
$apiEndpoint = $segments[count($segments) - 1] ?? '';

// Rutas públicas (no requieren autenticación)
$publicRoutes = ['login', 'registro', 'health'];

if (!in_array($apiEndpoint, $publicRoutes) && $apiEndpoint != '') {
    $userId = getAuthenticatedUser();
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['error' => 'No autorizado']);
        exit;
    }
}

// Enrutamiento básico
switch ($apiEndpoint) {
    case '':
        // Raíz de la API
        response(['message' => 'API Control de Jornada', 'version' => '1.0']);
        break;
    
    case 'empleados':
        require 'empleados.php';
        break;
    
    case 'jornadas':
        require 'jornadas.php';
        break;
    
    case 'login':
        handleLogin();
        break;
    
    case 'health':
        response(['status' => 'ok']);
        break;
    
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Ruta no encontrada']);
        exit;
}

function handleLogin() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        response(['error' => 'Método no permitido'], 405);
    }
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['email']) || !isset($data['password'])) {
            response(['error' => 'Datos incompletos'], 400);
        }
        
        $db = getConnection();
        $stmt = $db->prepare('SELECT id, nombre, password, rol_id FROM empleados WHERE email = ? AND activo = 1');
        $stmt->execute([$data['email']]);
        $empleado = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$empleado || !password_verify($data['password'], $empleado['password'])) {
            response(['error' => 'Credenciales inválidas'], 401);
        }
        
        // Obtener información del rol
        $stmt = $db->prepare('SELECT nombre FROM roles WHERE id = ?');
        $stmt->execute([$empleado['rol_id']]);
        $rol = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // En un sistema real, generaríamos un JWT
        // Por simplicidad, usamos el ID como "token"
        $token = $empleado['id'];
        
        // Registrar el acceso
        logAction($empleado['id'], 'login', 'Acceso al sistema');
        
        unset($empleado['password']); // No devolver la contraseña
        
        response([
            'token' => $token,
            'empleado' => [
                'id' => $empleado['id'],
                'nombre' => $empleado['nombre'],
                'rol' => $rol ? $rol['nombre'] : 'empleado'
            ]
        ]);
    } catch (PDOException $e) {
        response(['error' => 'Error al iniciar sesión: ' . $e->getMessage()], 500);
    }
}
