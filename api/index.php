<?php
// API RESTful principal
require_once 'config.php';

// Verificar auth para rutas protegidas
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$segments = explode('/', trim($path, '/'));
$apiEndpoint = $segments[count($segments) - 1] ?? '';

// Rutas públicas (no requieren autenticación)
$publicRoutes = ['login', 'registro', 'health', 'recuperar-password', 'reset-password'];

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
        
        // Modificada la consulta para evitar el error de department_id
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
        error_log('Error en login: ' . $e->getMessage());
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
                if ($empresa) {
                    $empresaId = $empresa['id'];
                }
            }
            
            // Comprobar si tenemos todos los campos necesarios
            $nombre = $data['firstName'] ?? 'Usuario';
            $apellidos = $data['lastName'] ?? '';
            $email = $data['email'];
            $password = password_hash($data['password'], PASSWORD_DEFAULT);
            $dni = $data['dni'] ?? null;
            $pais = $data['country'] ?? 'España';
            $ciudad = $data['province'] ?? null;
            $direccion = $data['companyAddress'] ?? null; // Guardamos la dirección del empleado (aunque el campo se llame companyAddress)
            $codigoPostal = $data['zipCode'] ?? null;
            $telefono = $data['phone'] ?? null;
            
            // Depuración - Mostrar qué datos estamos intentando insertar
            error_log("Intentando insertar empleado con datos: " . print_r([
                'id' => $id,
                'nombre' => $nombre,
                'apellidos' => $apellidos,
                'email' => $email,
                'rol_id' => $rolId,
                'empresa_id' => $empresaId,
                'pais' => $pais,
                'ciudad' => $ciudad,
                'direccion' => $direccion,
                'codigo_postal' => $codigoPostal,
                'telefono' => $telefono
            ], true));
            
            // Verificar si la columna empresa_id existe en la tabla
            try {
                $columnsQuery = $db->prepare("SHOW COLUMNS FROM empleados LIKE 'empresa_id'");
                $columnsQuery->execute();
                $empresaColumnExists = ($columnsQuery->rowCount() > 0);
                
                // Construir la consulta SQL de forma dinámica para evitar problemas de columnas
                $fields = [];
                $placeholders = [];
                $values = [];
                
                // Campos obligatorios
                $fields[] = 'id';
                $placeholders[] = '?';
                $values[] = $id;
                
                $fields[] = 'nombre';
                $placeholders[] = '?';
                $values[] = $nombre;
                
                $fields[] = 'apellidos';
                $placeholders[] = '?';
                $values[] = $apellidos;
                
                $fields[] = 'email';
                $placeholders[] = '?';
                $values[] = $email;
                
                $fields[] = 'password';
                $placeholders[] = '?';
                $values[] = $password;
                
                $fields[] = 'rol_id';
                $placeholders[] = '?';
                $values[] = $rolId;
                
                $fields[] = 'activo';
                $placeholders[] = '1';
                
                // Campos opcionales
                if ($dni !== null) {
                    $fields[] = 'dni';
                    $placeholders[] = '?';
                    $values[] = $dni;
                }
                
                // Solo añadir empresa_id si la columna existe
                if ($empresaId !== null && $empresaColumnExists) {
                    $fields[] = 'empresa_id';
                    $placeholders[] = '?';
                    $values[] = $empresaId;
                }
                
                if ($pais !== null) {
                    $fields[] = 'pais';
                    $placeholders[] = '?';
                    $values[] = $pais;
                }
                
                if ($ciudad !== null) {
                    $fields[] = 'ciudad';
                    $placeholders[] = '?';
                    $values[] = $ciudad;
                }
                
                if ($direccion !== null) {
                    $fields[] = 'direccion';
                    $placeholders[] = '?';
                    $values[] = $direccion;
                }
                
                if ($codigoPostal !== null) {
                    $fields[] = 'codigo_postal';
                    $placeholders[] = '?';
                    $values[] = $codigoPostal;
                }
                
                if ($telefono !== null) {
                    $fields[] = 'telefono';
                    $placeholders[] = '?';
                    $values[] = $telefono;
                }
                
                // Construir y ejecutar la consulta
                $sql = 'INSERT INTO empleados (' . implode(', ', $fields) . ') VALUES (' . implode(', ', $placeholders) . ')';
                error_log("SQL generado: " . $sql);
                
                $stmt = $db->prepare($sql);
                $stmt->execute($values);
                
            } catch (PDOException $innerEx) {
                error_log("Error al insertar empleado: " . $innerEx->getMessage());
                throw $innerEx;
            }
        }
        
        logAction($id, 'registro', 'Nuevo usuario registrado');
        
        response([
            'success' => true,
            'message' => 'Registro completado correctamente'
        ]);
    } catch (PDOException $e) {
        error_log('Error al registrar: ' . $e->getMessage() . ' - SQL State: ' . $e->getCode());
        response(['error' => 'Error al registrar: ' . $e->getMessage()], 500);
    }
}

function handleRecuperarPassword() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        response(['error' => 'Método no permitido'], 405);
    }
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['email'])) {
            response(['error' => 'Datos incompletos'], 400);
        }
        
        $email = $data['email'];
        $db = getConnection();
        
        // Verificar si el email existe
        $stmt = $db->prepare('SELECT id, nombre FROM empleados WHERE email = ? AND activo = 1');
        $stmt->execute([$email]);
        $empleado = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$empleado) {
            // No revelamos si el email existe o no para evitar ataques de enumeración
            response(['success' => true, 'message' => 'Si el correo existe, se ha enviado un enlace de recuperación']);
        }
        
        // Generar token único
        $token = bin2hex(random_bytes(32));
        $expiryDate = date('Y-m-d H:i:s', strtotime('+24 hours'));
        
        // Guardar el token en la base de datos
        $stmt = $db->prepare('INSERT INTO reset_tokens (empleado_id, token, expiry_date) VALUES (?, ?, ?)');
        $stmt->execute([$empleado['id'], $token, $expiryDate]);
        
        // En un entorno real, aquí enviaríamos el correo electrónico
        // Por ahora, simulamos que el correo se envía correctamente
        
        // URL de restablecimiento (en un entorno real apuntaría a tu dominio)
        $resetUrl = 'http://aplium.com/apphora/password-reset-confirm?token=' . $token;
        
        // Registro en el log
        logAction($empleado['id'], 'recuperar_password', 'Solicitud de recuperación de contraseña', $_SERVER['REMOTE_ADDR']);
        
        // Respuesta al cliente
        response(['success' => true, 'message' => 'Se ha enviado un enlace de recuperación a tu correo electrónico']);
        
    } catch (PDOException $e) {
        error_log('Error en recuperación de contraseña: ' . $e->getMessage());
        response(['error' => 'Error al procesar la solicitud'], 500);
    }
}

function handleResetPassword() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        response(['error' => 'Método no permitido'], 405);
    }
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['token']) || !isset($data['password']) || !isset($data['confirmPassword'])) {
            response(['error' => 'Datos incompletos'], 400);
        }
        
        if ($data['password'] !== $data['confirmPassword']) {
            response(['error' => 'Las contraseñas no coinciden'], 400);
        }
        
        $token = $data['token'];
        $password = $data['password'];
        
        $db = getConnection();
        
        // Verificar token válido y no expirado
        $stmt = $db->prepare('SELECT empleado_id FROM reset_tokens WHERE token = ? AND expiry_date > NOW() AND used = 0');
        $stmt->execute([$token]);
        $resetToken = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$resetToken) {
            response(['error' => 'El token no es válido o ha expirado'], 400);
        }
        
        $empleadoId = $resetToken['empleado_id'];
        
        // Actualizar la contraseña
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $db->prepare('UPDATE empleados SET password = ? WHERE id = ?');
        $stmt->execute([$hashedPassword, $empleadoId]);
        
        // Marcar el token como usado
        $stmt = $db->prepare('UPDATE reset_tokens SET used = 1 WHERE token = ?');
        $stmt->execute([$token]);
        
        // Registro en el log
        logAction($empleadoId, 'reset_password', 'Contraseña actualizada correctamente', $_SERVER['REMOTE_ADDR']);
        
        response(['success' => true, 'message' => 'Contraseña actualizada correctamente']);
        
    } catch (PDOException $e) {
        error_log('Error en restablecimiento de contraseña: ' . $e->getMessage());
        response(['error' => 'Error al procesar la solicitud'], 500);
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
