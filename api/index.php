
<?php
// API RESTful principal
require_once 'config.php';
require_once 'auth.php';
require_once 'utils.php';

// Verificar auth para rutas protegidas
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$segments = explode('/', trim($path, '/'));
$apiEndpoint = $segments[count($segments) - 1] ?? '';

// Rutas públicas (no requieren autenticación)
$publicRoutes = ['login', 'registro', 'health', 'recuperar-password', 'reset-password'];

// Verificar si es una ruta pública o si necesita autenticación
if (!in_array($apiEndpoint, $publicRoutes) && $apiEndpoint != '') {
    // Para depuración
    error_log("Ruta requiere autenticación: " . $apiEndpoint);
    
    $userId = getAuthenticatedUser();
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['error' => 'No autorizado']);
        exit;
    }
} else {
    // Para depuración
    error_log("Ruta pública: " . $apiEndpoint);
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
        
    case 'registro':
        handleRegistro();
        break;
    
    case 'recuperar-password':
        handleRecuperarPassword();
        break;
        
    case 'reset-password':
        handleResetPassword();
        break;
    
    case 'health':
        response(['status' => 'ok']);
        break;
    
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Ruta no encontrada']);
        exit;
}
