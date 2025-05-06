
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
        
    case 'registro':
        handleRegistro();
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
        $stmt = $db->prepare('SELECT id, nombre, password, rol_id, department_id FROM empleados WHERE email = ? AND activo = 1');
        $stmt->execute([$data['email']]);
        $empleado = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$empleado || !password_verify($data['password'], $empleado['password'])) {
            response(['error' => 'Credenciales inválidas'], 401);
        }
        
        // Obtener información del rol
        $stmt = $db->prepare('SELECT nombre FROM roles WHERE id = ?');
        $stmt->execute([$empleado['rol_id']]);
        $rol = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Determinar si es empresa o empleado
        $esEmpresa = false;
        if ($rol && ($rol['nombre'] === 'administrador' || $rol['nombre'] === 'empresa')) {
            $esEmpresa = true;
        }
        
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
                'rol' => $rol ? $rol['nombre'] : 'empleado',
                'esEmpresa' => $esEmpresa
            ]
        ]);
    } catch (PDOException $e) {
        response(['error' => 'Error al iniciar sesión: ' . $e->getMessage()], 500);
    }
}

function handleRegistro() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        response(['error' => 'Método no permitido'], 405);
    }
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Validar datos mínimos
        if (!isset($data['email']) || !isset($data['password']) || !isset($data['type'])) {
            response(['error' => 'Datos incompletos'], 400);
        }
        
        $db = getConnection();
        
        // Verificar si el correo ya está registrado
        $stmt = $db->prepare('SELECT id FROM empleados WHERE email = ?');
        $stmt->execute([$data['email']]);
        if ($stmt->rowCount() > 0) {
            response(['error' => 'El correo electrónico ya está registrado'], 400);
        }
        
        // Generar UUID para el nuevo usuario
        $id = generateUUID();
        
        // Determinar el rol según el tipo de registro
        if ($data['type'] === 'company') {
            // Buscar rol de empresa
            $stmt = $db->prepare('SELECT id FROM roles WHERE nombre = "empresa" OR nombre = "administrador" LIMIT 1');
            $stmt->execute();
            $rol = $stmt->fetch(PDO::FETCH_ASSOC);
            $rolId = $rol ? $rol['id'] : 1; // Por defecto rol admin si no existe rol empresa
            
            // Insertar empresa
            $stmt = $db->prepare('INSERT INTO empleados (id, nombre, apellidos, email, password, dni, rol_id, cargo, pais, ciudad, direccion, codigo_postal, telefono, activo) 
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)');
            
            $stmt->execute([
                $id, 
                $data['companyName'] ?? 'Empresa',
                '',
                $data['email'],
                password_hash($data['password'], PASSWORD_DEFAULT),
                $data['companyNif'] ?? null,
                $rolId,
                'Director',
                $data['country'] ?? 'España',
                $data['province'] ?? null,
                $data['companyAddress'] ?? null,
                $data['zipCode'] ?? null,
                $data['phone'] ?? null
            ]);
        } else {
            // Es un empleado
            // Buscar rol de empleado
            $stmt = $db->prepare('SELECT id FROM roles WHERE nombre = "empleado" LIMIT 1');
            $stmt->execute();
            $rol = $stmt->fetch(PDO::FETCH_ASSOC);
            $rolId = $rol ? $rol['id'] : 2; // Por defecto rol empleado
            
            // Buscar empresa por NIF/CIF
            $empresaId = null;
            if (isset($data['companyNif']) && !empty($data['companyNif'])) {
                $stmt = $db->prepare('SELECT id FROM empleados WHERE dni = ? AND rol_id IN (SELECT id FROM roles WHERE nombre IN ("empresa", "administrador")) LIMIT 1');
                $stmt->execute([$data['companyNif']]);
                $empresa = $stmt->fetch(PDO::FETCH_ASSOC);
                $empresaId = $empresa ? $empresa['id'] : null;
            }
            
            // Insertar empleado
            $stmt = $db->prepare('INSERT INTO empleados (id, nombre, apellidos, email, password, dni, rol_id, empresa_id, cargo, pais, ciudad, direccion, codigo_postal, telefono, activo) 
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)');
            
            $stmt->execute([
                $id,
                $data['firstName'] ?? 'Usuario',
                $data['lastName'] ?? '',
                $data['email'],
                password_hash($data['password'], PASSWORD_DEFAULT),
                $data['dni'] ?? null,
                $rolId,
                $empresaId,
                'Empleado',
                $data['country'] ?? 'España',
                $data['province'] ?? null,
                '',
                $data['zipCode'] ?? null,
                $data['phone'] ?? null
            ]);
        }
        
        logAction($id, 'registro', 'Nuevo usuario registrado');
        
        response([
            'success' => true,
            'message' => 'Registro completado correctamente'
        ]);
    } catch (PDOException $e) {
        response(['error' => 'Error al registrar: ' . $e->getMessage()], 500);
    }
}

// Función para generar UUID v4
function generateUUID() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}
