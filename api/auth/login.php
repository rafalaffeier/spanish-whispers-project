
<?php
// Login functionality

/**
 * Handles user login
 */
function handleLogin() {
    // Verify method
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
        exit;
    }
    
    // Obtener datos del cuerpo de la petición
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['email']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Faltan credenciales']);
        exit;
    }
    
    try {
        $db = getConnection();
        
        // Buscar empleado por email
        $stmt = $db->prepare('SELECT * FROM empleados WHERE email = ? AND activo = 1');
        $stmt->execute([$data['email']]);
        $empleado = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Si no existe o la contraseña no coincide
        if (!$empleado) {
            http_response_code(401);
            echo json_encode(['error' => 'Email no encontrado']);
            exit;
        }
        
        // Verificar contraseña
        if (!password_verify($data['password'], $empleado['password'])) {
            // Log para depuración
            error_log("Contraseña incorrecta para {$data['email']}");
            
            http_response_code(401);
            echo json_encode(['error' => 'Contraseña incorrecta']);
            exit;
        }
        
        // Determinar si es una empresa o empleado
        $esEmpresa = $empleado['rol_id'] == 5; // Asumiendo que rol_id 5 es 'empresa'
        
        // Crear respuesta
        $respuesta = [
            'token' => $empleado['id'], // Usar ID como token simple
            'empleado' => [
                'id' => $empleado['id'],
                'nombre' => $empleado['nombre'],
                'rol' => $esEmpresa ? 'empresa' : ($empleado['rol_id'] == 1 ? 'administrador' : 'empleado'),
                'esEmpresa' => $esEmpresa
            ]
        ];
        
        // Registrar acción
        logAction($empleado['id'], 'login', 'Login exitoso');
        
        response($respuesta);
    } catch (PDOException $e) {
        error_log("Error en login: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Error de conexión. Por favor contacte al administrador.']);
        exit;
    }
}
