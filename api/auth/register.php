
<?php
// Registration functionality

/**
 * Handles user registration
 */
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
