<?php
// API RESTful principal
require_once 'config.php';
require_once 'utils.php';       // Se asegura cargar una sola vez
require_once 'auth/index.php';

// Verificar auth para rutas protegidas
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$segments = explode('/', trim($path, '/'));
$apiEndpoint = $segments[count($segments) - 1] ?? '';

// Obtener parámetros de consulta para casos especiales
$query = $_SERVER['QUERY_STRING'] ?? '';
parse_str($query, $queryParams);

// Rutas públicas (no requieren autenticación)
$publicRoutes = ['login', 'registro', 'health', 'recuperar-password', 'reset-password'];

// Verificar si es una ruta pública o si necesita autenticación
// Casos especiales: permitir consultas de verificación de empresas sin auth
$isCompanyVerification = false;
if ($apiEndpoint === 'empresas' && isset($queryParams['nif'])) {
    $isCompanyVerification = true;
    error_log("Solicitud de verificación de empresa por NIF: " . $queryParams['nif']);
}

if ($apiEndpoint === 'verify' && $segments[count($segments) - 2] === 'empresas') {
    $isCompanyVerification = true;
    error_log("Solicitud de verificación de empresa en endpoint verify");
}

if (!in_array($apiEndpoint, $publicRoutes) && $apiEndpoint != '' && !$isCompanyVerification) {
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
    error_log("Ruta pública: " . $apiEndpoint . ($isCompanyVerification ? " (verificación de empresa)" : ""));
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
    
    case 'empresas':
        require 'empresas.php';
        break;
        
    default:
        if ($segments[count($segments) - 2] === 'empresas' && $apiEndpoint === 'verify') {
            // Ruta especial para verificación de empresa
            if (isset($_GET['nif'])) {
                require_once 'empresas.php';
                handleCompanyVerification($_GET['nif']);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'NIF no proporcionado']);
            }
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Ruta no encontrada']);
            exit;
        }
}
