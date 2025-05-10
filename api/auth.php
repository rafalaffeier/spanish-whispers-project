<?php
// Funciones de autenticación y registro

// Función para manejar el login
function handleLogin() {
    // Verificar método
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

// Función para manejar el registro
function handleRegistro() {
    // Debug para ver los datos entrantes
    $requestBody = file_get_contents('php://input');
    error_log("Inicio de registro con datos: " . $requestBody);
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
        exit;
    }
    
    $data = json_decode($requestBody, true);
    if ($data === null) {
        error_log("Error al decodificar JSON: " . json_last_error_msg());
        http_response_code(400);
        echo json_encode(['error' => 'JSON inválido: ' . json_last_error_msg()]);
        exit;
    }
    
    // Validar campos mínimos
    if (!isset($data['email']) || !isset($data['password'])) {
        error_log("Faltan datos obligatorios: email o contraseña");
        http_response_code(400);
        echo json_encode(['error' => 'Faltan datos obligatorios: email o contraseña']);
        exit;
    }
    
    try {
        $db = getConnection();
        
        // Verificar si el email ya existe
        $stmt = $db->prepare('SELECT id FROM empleados WHERE email = ?');
        $stmt->execute([$data['email']]);
        
        if ($stmt->fetch()) {
            error_log("Email ya registrado: " . $data['email']);
            http_response_code(409);
            echo json_encode(['error' => 'El email ya está registrado']);
            exit;
        }
        
        // Determinar si es registro de empresa o empleado
        // Si es_empresa está definido, lo usamos; si no, verificamos type
        if (isset($data['es_empresa'])) {
            $esEmpresa = $data['es_empresa'] === true;
        } else if (isset($data['type'])) {
            $esEmpresa = $data['type'] === 'company';
        } else {
            $esEmpresa = false;
        }
        
        // Debug para empresa
        if ($esEmpresa) {
            error_log("Registrando EMPRESA: " . json_encode($data));
        } else {
            error_log("Registrando EMPLEADO: " . json_encode($data));
        }
        
        // Generar ID único
        $id = generateUUID();
        
        // Datos básicos
        $nombre = $esEmpresa ? ($data['nombre'] ?? '') : ($data['nombre'] ?? '');
        $apellidos = $esEmpresa ? '' : ($data['apellidos'] ?? '');
        $password = password_hash($data['password'], PASSWORD_DEFAULT);
        
        // Determinar el rol_id (5 para empresa, 2 para empleado normal)
        $rolId = $esEmpresa ? 5 : 2;
        
        // Datos adicionales
        $dni = $esEmpresa ? ($data['nif'] ?? null) : ($data['dni'] ?? null);
        $telefono = $data['telefono'] ?? null;
        $direccion = $data['direccion'] ?? null;
        $provincia = $data['provincia'] ?? null;
        $pais = $data['pais'] ?? 'España';
        $codigoPostal = $data['codigo_postal'] ?? null;
        
        if ($esEmpresa && empty($nombre)) {
            error_log("Falta nombre de empresa");
            http_response_code(400);
            echo json_encode(['error' => 'El nombre de la empresa es obligatorio']);
            exit;
        }
        
        // Iniciar transacción para asegurar consistencia
        $db->beginTransaction();
        
        try {
            // Consulta SQL para debug
            $sqlDebug = "INSERT INTO empleados 
                          (id, nombre, apellidos, email, password, dni, rol_id, 
                           telefono, direccion, ciudad, pais, codigo_postal, activo) 
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)";
            error_log("SQL a ejecutar: " . $sqlDebug);
            error_log("Parámetros: " . json_encode([$id, $nombre, $apellidos, $data['email'], 
                                                  'password_hash', $dni, $rolId, $telefono, 
                                                  $direccion, $provincia, $pais, $codigoPostal]));
            
            // Insertar empleado
            $stmt = $db->prepare($sqlDebug);
            $stmt->execute([
                $id,
                $nombre,
                $apellidos,
                $data['email'],
                $password,
                $dni,
                $rolId,
                $telefono,
                $direccion,
                $provincia,
                $pais,
                $codigoPostal
            ]);
            
            // Confirmar transacción
            $db->commit();
            
            // Registrar acción exitosa
            logAction($id, 'registro', $esEmpresa ? 'Registro de empresa exitoso' : 'Registro de empleado exitoso');
            
            // Responder con éxito
            response(['message' => $esEmpresa ? 'Empresa registrada correctamente' : 'Empleado registrado correctamente', 'id' => $id]);
        } catch (PDOException $e) {
            // Revertir transacción en caso de error
            $db->rollBack();
            throw $e; // Re-lanzar para capturar en el bloque principal
        }
    } catch (PDOException $e) {
        error_log("Error SQL en registro: " . $e->getMessage() . " - Código: " . $e->getCode());
        
        // Determinar mensaje de error
        $errorMsg = 'Error al registrar en la base de datos';
        if ($e->getCode() == '23000') {
            $errorMsg = 'Ya existe un registro con esa información';
        }
        
        http_response_code(500);
        echo json_encode(['error' => $errorMsg, 'details' => $e->getMessage()]);
        exit;
    } catch (Exception $e) {
        // Capturar cualquier otra excepción
        error_log("Error general en registro: " . $e->getMessage() . " - Código: " . $e->getCode());
        http_response_code(500);
        echo json_encode(['error' => 'Error general al registrar: ' . $e->getMessage()]);
        exit;
    }
}

// Función para manejar recuperación de contraseña
function handleRecuperarPassword() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
        exit;
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['email'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Falta dirección de email']);
        exit;
    }
    
    try {
        $db = getConnection();
        
        // Verificar si existe el email
        $stmt = $db->prepare('SELECT id, nombre FROM empleados WHERE email = ? AND activo = 1');
        $stmt->execute([$data['email']]);
        $empleado = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$empleado) {
            // Por seguridad, no indicamos si existe o no
            response(['message' => 'Si la dirección existe, recibirás un email con instrucciones']);
        }
        
        // Generar token de reseteo
        $token = bin2hex(random_bytes(32));
        $expiry = date('Y-m-d H:i:s', strtotime('+24 hours'));
        
        // Guardar token en base de datos
        $stmt = $db->prepare('INSERT INTO reset_tokens (empleado_id, token, expiry_date) 
                              VALUES (?, ?, ?)');
        $stmt->execute([$empleado['id'], $token, $expiry]);
        
        // En un entorno real, aquí enviaríamos un email con el enlace para resetear
        // Por ahora solo registramos la acción
        logAction($empleado['id'], 'solicitar_reset', 'Solicitud de restablecimiento de contraseña');
        
        response(['message' => 'Si la dirección existe, recibirás un email con instrucciones']);
    } catch (PDOException $e) {
        error_log("Error en recuperación de contraseña: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Error al procesar la solicitud']);
        exit;
    }
}

// Función para manejar el reseteo de contraseña
function handleResetPassword() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
        exit;
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['token']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Faltan datos obligatorios']);
        exit;
    }
    
    try {
        $db = getConnection();
        
        // Verificar token
        $stmt = $db->prepare('SELECT empleado_id FROM reset_tokens 
                              WHERE token = ? AND expiry_date > NOW() AND used = 0');
        $stmt->execute([$data['token']]);
        $token = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$token) {
            http_response_code(400);
            echo json_encode(['error' => 'Token inválido o expirado']);
            exit;
        }
        
        // Actualizar contraseña
        $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
        $stmt = $db->prepare('UPDATE empleados SET password = ? WHERE id = ?');
        $stmt->execute([$hashedPassword, $token['empleado_id']]);
        
        // Marcar token como usado
        $stmt = $db->prepare('UPDATE reset_tokens SET used = 1 WHERE token = ?');
        $stmt->execute([$data['token']]);
        
        logAction($token['empleado_id'], 'reset_password', 'Restablecimiento de contraseña exitoso');
        
        response(['message' => 'Contraseña actualizada correctamente']);
    } catch (PDOException $e) {
        error_log("Error en reset de contraseña: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Error al restablecer la contraseña']);
        exit;
    }
}

// Utility function to generate UUID
function generateUUID() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        // 32 bits for "time_low"
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        // 16 bits for "time_mid"
        mt_rand(0, 0xffff),
        // 16 bits for "time_hi_and_version",
        // four most significant bits holds version number 4
        mt_rand(0, 0x0fff) | 0x4000,
        // 16 bits, 8 bits for "clk_seq_hi_res",
        // 8 bits for "clk_seq_low",
        // two most significant bits holds zero and one for variant DCE1.1
        mt_rand(0, 0x3fff) | 0x8000,
        // 48 bits for "node"
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}
