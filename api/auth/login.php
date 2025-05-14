
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
        
        // Buscar usuario por email
        $stmt = $db->prepare('SELECT u.*, r.nombre AS rol_nombre FROM users u 
                             JOIN roles r ON u.rol_id = r.id 
                             WHERE u.email = ? AND u.activo = 1');
        $stmt->execute([$data['email']]);
        $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Si no existe o la contraseña no coincide
        if (!$usuario) {
            http_response_code(401);
            echo json_encode(['error' => 'Email no encontrado']);
            exit;
        }
        
        // Verificar contraseña
        if (!password_verify($data['password'], $usuario['password'])) {
            // Log para depuración
            error_log("Contraseña incorrecta para {$data['email']}");
            
            http_response_code(401);
            echo json_encode(['error' => 'Contraseña incorrecta']);
            exit;
        }
        
        // Determinar si es empleador o empleado
        $esEmpleador = $usuario['rol_nombre'] === 'empleador'; 
        
        // Obtener información adicional según tipo de usuario
        if ($esEmpleador) {
            $stmt = $db->prepare('SELECT * FROM empresas WHERE user_id = ?');
            $stmt->execute([$usuario['id']]);
            $entidad = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$entidad) {
                error_log("Usuario empleador sin entidad asociada: {$usuario['id']}");
            }
        } else {
            $stmt = $db->prepare('SELECT e.*, emp.nombre AS nombre_empresa 
                                 FROM empleados e 
                                 LEFT JOIN empresas emp ON e.empresa_id = emp.id 
                                 WHERE e.user_id = ?');
            $stmt->execute([$usuario['id']]);
            $entidad = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$entidad) {
                error_log("Usuario empleado sin entidad asociada: {$usuario['id']}");
            }
        }
        
        // Mapear datos para la respuesta
        $nombreEntidad = null;
        $entityId = null;
        if ($entidad) {
            if ($esEmpleador) {
                $nombreEntidad = $entidad['nombre'];
            } else {
                $nombreEntidad = trim(($entidad['nombre'] ?? '') . ' ' . ($entidad['apellidos'] ?? ''));
            }
            $entityId = $entidad['id'];
        }
        
        // Crear respuesta adaptada al frontend (key: employee, campos: name, isCompany, role)
        $respuesta = [
            'token' => $usuario['id'],
            'employee' => [
                'id' => $entityId,
                'userId' => $usuario['id'],
                'name' => $nombreEntidad ?? 'Usuario',
                'role' => $usuario['rol_nombre'], // 'empleador' o 'empleado'
                'isCompany' => $esEmpleador
            ]
        ];
        
        // Registrar acción
        logAction($usuario['id'], 'login', 'Login exitoso');
        
        // Actualizar último acceso
        $stmt = $db->prepare('UPDATE users SET ultimo_acceso = NOW() WHERE id = ?');
        $stmt->execute([$usuario['id']]);
        
        response($respuesta);
    } catch (PDOException $e) {
        error_log("Error en login: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Error de conexión. Por favor contacte al administrador.']);
        exit;
    }
}
