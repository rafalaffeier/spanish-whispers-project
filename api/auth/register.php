
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
        $stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$data['email']]);
        
        if ($stmt->fetch()) {
            error_log("Email ya registrado: " . $data['email']);
            http_response_code(409);
            echo json_encode(['error' => 'El email ya está registrado']);
            exit;
        }
        
        // Determinar si es registro de empresa (empleador) o empleado
        // Si es_empresa está definido, lo usamos; si no, verificamos type
        if (isset($data['es_empresa'])) {
            $esEmpleador = $data['es_empresa'] === true;
        } else if (isset($data['type'])) {
            $esEmpleador = $data['type'] === 'company';
        } else {
            $esEmpleador = false;
        }
        
        // Debug para empresa
        if ($esEmpleador) {
            error_log("Registrando EMPLEADOR: " . json_encode($data));
        } else {
            error_log("Registrando EMPLEADO: " . json_encode($data));
        }
        
        // Generar IDs únicos
        $userId = generateUUID();
        $entidadId = generateUUID();
        
        // Iniciar transacción para asegurar consistencia
        $db->beginTransaction();
        
        try {
            // 1. Crear el registro de usuario (común para ambos)
            $password = password_hash($data['password'], PASSWORD_DEFAULT);
            
            // Rol: 1 para empleador, 2 para empleado
            $rolId = $esEmpleador ? 1 : 2;
            
            // Insertar usuario
            $stmt = $db->prepare('INSERT INTO users (id, email, password, rol_id, activo) VALUES (?, ?, ?, ?, 1)');
            $stmt->execute([$userId, $data['email'], $password, $rolId]);
            
            // 2. Crear registro específico según tipo
            if ($esEmpleador) {
                // Datos de empresa
                $nombreEmpresa = $data['nombre'] ?? $data['companyName'] ?? '';
                $nifEmpresa = $data['nif'] ?? $data['companyNif'] ?? '';
                $telefono = $data['telefono'] ?? $data['phone'] ?? '';
                $direccion = $data['direccion'] ?? $data['companyAddress'] ?? '';
                $provincia = $data['provincia'] ?? $data['province'] ?? '';
                $codigoPostal = $data['codigo_postal'] ?? $data['zipCode'] ?? '';
                $pais = $data['pais'] ?? $data['country'] ?? 'España';
                
                // Validar datos críticos
                if (empty($nombreEmpresa)) {
                    throw new Exception("El nombre de la empresa es obligatorio");
                }
                
                // Insertar empresa
                $stmt = $db->prepare('INSERT INTO empresas 
                    (id, user_id, nombre, nif, telefono, direccion, provincia, codigo_postal, pais, email) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
                $stmt->execute([
                    $entidadId,
                    $userId,
                    $nombreEmpresa,
                    $nifEmpresa,
                    $telefono,
                    $direccion,
                    $provincia,
                    $codigoPostal,
                    $pais,
                    $data['email']
                ]);
                
                $mensaje = 'Empresa registrada correctamente';
            } else {
                // Si es empleado, necesitamos la empresa asociada
                if (!isset($data['companyNif']) && !isset($data['empresa_id'])) {
                    throw new Exception("Se requiere NIF de empresa o ID de empresa para registrar empleado");
                }
                
                // Buscar la empresa por NIF si se proporciona
                $empresaId = null;
                if (isset($data['companyNif']) && !empty($data['companyNif'])) {
                    $stmt = $db->prepare('SELECT id FROM empresas WHERE nif = ?');
                    $stmt->execute([$data['companyNif']]);
                    $empresa = $stmt->fetch();
                    
                    if (!$empresa) {
                        throw new Exception("No existe una empresa con el NIF proporcionado");
                    }
                    
                    $empresaId = $empresa['id'];
                } else if (isset($data['empresa_id'])) {
                    $empresaId = $data['empresa_id'];
                }
                
                // Datos del empleado
                $nombre = $data['nombre'] ?? $data['firstName'] ?? '';
                $apellidos = $data['apellidos'] ?? $data['lastName'] ?? '';
                $dni = $data['dni'] ?? '';
                $telefono = $data['telefono'] ?? $data['phone'] ?? '';
                $direccion = $data['direccion'] ?? $data['companyAddress'] ?? '';
                $ciudad = $data['ciudad'] ?? $data['city'] ?? $data['province'] ?? '';
                $provincia = $data['provincia'] ?? $data['province'] ?? '';
                $codigoPostal = $data['codigo_postal'] ?? $data['zipCode'] ?? '';
                $pais = $data['pais'] ?? $data['country'] ?? 'España';
                
                // Validar datos críticos
                if (empty($nombre) || empty($apellidos)) {
                    throw new Exception("El nombre y apellidos son obligatorios");
                }
                
                // Insertar empleado
                $stmt = $db->prepare('INSERT INTO empleados 
                    (id, user_id, empresa_id, nombre, apellidos, dni, 
                     telefono, direccion, ciudad, codigo_postal, pais) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
                $stmt->execute([
                    $entidadId,
                    $userId,
                    $empresaId,
                    $nombre,
                    $apellidos,
                    $dni,
                    $telefono,
                    $direccion,
                    $ciudad,
                    $codigoPostal,
                    $pais
                ]);
                
                $mensaje = 'Empleado registrado correctamente';
            }
            
            // Confirmar transacción
            $db->commit();
            
            // Registrar acción exitosa
            logAction($userId, 'registro', $esEmpleador ? 'Registro de empresa exitoso' : 'Registro de empleado exitoso');
            
            // Responder con éxito
            response([
                'message' => $mensaje, 
                'id' => $userId, 
                'entityId' => $entidadId,
                'type' => $esEmpleador ? 'company' : 'employee'
            ]);
            
        } catch (Exception $e) {
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
