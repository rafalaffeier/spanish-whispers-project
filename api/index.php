
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

// --- AUTH DEBUGGING PATCH START ---
if (!in_array($apiEndpoint, $publicRoutes) && $apiEndpoint != '' && !$isCompanyVerification) {
    // Para depuración
    error_log("Ruta requiere autenticación: " . $apiEndpoint);

    // DEBUG: Listar todas las cabeceras que recibe PHP
    if (function_exists('getallheaders')) {
        foreach (getallheaders() as $name => $value) {
            error_log("HEADER [$name]: $value");
        }
    } else {
        error_log("getallheaders() no disponible en este entorno PHP");
    }

    // DEBUG: Comprobar si la cabecera Authorization llega
    $authHeader = '';
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
        error_log("AUTH Header (HTTP_AUTHORIZATION): " . $authHeader);
    } elseif (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        if (isset($headers['Authorization'])) {
            $authHeader = $headers['Authorization'];
            error_log("AUTH Header (apache_request_headers): " . $authHeader);
        }
    } else {
        error_log("No Authorization header found via known methods");
    }

    // DEBUG: Validar el token recibido
    $userId = getAuthenticatedUser();

    if (!$userId) {
        // Mostrar información adicional del fallo: token decodificado/expiración
        $token = null;
        if ($authHeader && stripos($authHeader, 'Bearer ') === 0) {
            $token = trim(substr($authHeader, 7));
        }
        error_log("TOKEN recibido para validación: " . ($token ? $token : 'Ninguno'));
        if ($token) {
            $decoded = base64_decode($token);
            error_log("TOKEN base64_decode: " . ($decoded ? $decoded : 'no decodificable'));
            $json = json_decode($decoded, true);
            if (is_array($json)) {
                error_log("TOKEN json_decode resultado: " . print_r($json, true));
                // Mostrar expiración si existe
                if (isset($json['timestamp'])) {
                    $age = time() - intval($json['timestamp']);
                    error_log("TOKEN timestamp: {$json['timestamp']} (edad: {$age} segundos)");
                }
            } else {
                error_log("TOKEN json_decode: el token no es JSON válido");
            }
        }
        http_response_code(401);
        echo json_encode(['error' => 'No autorizado']);
        exit;
    }
    // Si todo fue ok se sigue ejecutando...
} else {
    // Para depuración
    error_log("Ruta pública: " . $apiEndpoint . ($isCompanyVerification ? " (verificación de empresa)" : ""));
}
// --- AUTH DEBUGGING PATCH END ---

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

