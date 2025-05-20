<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$empleadoId = isset($_GET['id']) ? $_GET['id'] : null;

switch ($method) {
    case 'GET':
        if ($empleadoId) {
            getEmpleado($empleadoId);
        } else {
            getEmpleados();
        }
        break;
    case 'POST':
        createEmpleado();
        break;
    case 'PUT':
        if (!$empleadoId) {
            response(['error' => 'ID de empleado no proporcionado'], 400);
        }
        updateEmpleado($empleadoId);
        break;
    case 'DELETE':
        if (!$empleadoId) {
            response(['error' => 'ID de empleado no proporcionado'], 400);
        }
        deleteEmpleado($empleadoId);
        break;
    default:
        response(['error' => 'Método no permitido'], 405);
}

function getEmpleados() {
    try {
        $db = ge tConnection();
        $stmt = $db->query('SELECT e.*, u.rol_id, r.nombre as rol_nombre, d.nombre as departamento_nombre 
                           FROM empleados e 
                           LEFT JOIN users u ON e.user_id = u.id
                           LEFT JOIN roles r ON u.rol_id = r.id 
                           LEFT JOIN departamentos d ON e.departamento_id = d.id 
                           ORDER BY e.nombre');
        $empleados = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($empleados as &$empleado) {
            unset($empleado['password']);
            // Asegúrate de devolver el nif de la empresa
            $empleado['nifdeMiEmpresa'] = $empleado['nifdeMiEmpresa'];
        }

        response($empleados);
    } catch (PDOException $e) {
        response(['error' => 'Error al obtener empleados: ' . $e->getMessage()], 500);
    }
}

 function getEmpleados() {
    $userId = getAuthenticatedUser();
    if (!$userId) {
        response(['error' => 'No autorizado'], 401);
    }

    $db = getConnection();

    // Obtener empresa_id del empleador autenticado
    $stmt = $db->prepare("SELECT empresa_id FROM empleados WHERE id = ?");
    $stmt->execute([$userId]);
    $empresaId = $stmt->fetchColumn();

    if (!$empresaId) {
        response(['error' => 'Empresa no encontrada'], 404);
    }

    // Obtener empleados de esa empresa
    $stmt = $db->prepare('SELECT e.*, u.rol_id, r.nombre as rol_nombre, d.nombre as departamento_nombre 
                          FROM empleados e 
                          LEFT JOIN users u ON e.user_id = u.id
                          LEFT JOIN roles r ON u.rol_id = r.id 
                          LEFT JOIN departamentos d ON e.departamento_id = d.id 
                          WHERE e.empresa_id = ?
                          ORDER BY e.nombre');
    $stmt->execute([$empresaId]);

    $empleados = $stmt->fetchAll(PDO::FETCH_ASSOC);
    response($empleados);
}


function createEmpleado() {
    try {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['nombre']) || !isset($data['email']) || !isset($data['nifdeMiEmpresa'])) {
            response(['error' => 'Datos incompletos'], 400);
        }

        $id = generateUUID();

        $db = getConnection();
        $stmt = $db->prepare('INSERT INTO empleados (id, user_id, nifdeMiEmpresa, nombre, apellidos, email, password, dni, 
                                  rol_id, departamento_id, cargo, division, 
                                  pais, ciudad, direccion, codigo_postal, telefono, avatar) 
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

        $password = isset($data['password']) ? password_hash($data['password'], PASSWORD_DEFAULT) : null;

        $stmt->execute([
            $id,
            $data['user_id'],
            $data['nifdeMiEmpresa'],
            $data['nombre'],
            $data['apellidos'] ?? '',
            $data['email'],
            $password,
            $data['dni'] ?? null,
            $data['rol_id'] ?? null,
            $data['departamento_id'] ?? null,
            $data['cargo'] ?? null,
            $data['division'] ?? null,
            $data['pais'] ?? null,
            $data['ciudad'] ?? null,
            $data['direccion'] ?? null,
            $data['codigo_postal'] ?? null,
            $data['telefono'] ?? null,
            $data['avatar'] ?? null
        ]);

        logAction(null, 'crear_empleado', "Nuevo empleado: $id - {$data['nombre']}");
        response(['id' => $id, 'message' => 'Empleado creado correctamente']);
    } catch (PDOException $e) {
        response(['error' => 'Error al crear empleado: ' . $e->getMessage()], 500);
    }
}

function updateEmpleado($id) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $db = getConnection();

        $checkStmt = $db->prepare('SELECT id FROM empleados WHERE id = ?');
        $checkStmt->execute([$id]);
        if (!$checkStmt->fetch()) {
            response(['error' => 'Empleado no encontrado'], 404);
        }

        $fields = [];
        $params = [];

        $allowedFields = [
            'nombre', 'apellidos', 'email', 'dni', 'rol_id', 'departamento_id',
            'cargo', 'division', 'pais', 'ciudad', 'direccion', 'codigo_postal',
            'telefono', 'avatar', 'dispositivo_autorizado', 'ip_autorizada', 'activo', 'nifdeMiEmpresa'
        ];

        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }

        if (isset($data['password']) && !empty($data['password'])) {
            $fields[] = "password = ?";
            $params[] = password_hash($data['password'], PASSWORD_DEFAULT);
        }

        if (empty($fields)) {
            response(['error' => 'No se proporcionaron campos para actualizar'], 400);
        }
        $params[] = $id;
        $sql = 'UPDATE empleados SET ' . implode(', ', $fields) . ' WHERE id = ?';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        logAction($id, 'actualizar_empleado', "Actualizado: $id");
        response(['message' => 'Empleado actualizado correctamente']);
    } catch (PDOException $e) {
        response(['error' => 'Error al actualizar empleado: ' . $e->getMessage()], 500);
    }
}

function deleteEmpleado($id) {
    try {
        $db = getConnection();
        $stmt = $db->prepare('DELETE FROM empleados WHERE id = ?');
        $stmt->execute([$id]);
        
        if ($stmt->rowCount() === 0) {
            response(['error' => 'Empleado no encontrado'], 404);
        }
        
        logAction(null, 'eliminar_empleado', "Eliminado: $id");
        response(['message' => 'Empleado eliminado correctamente']);
    } catch (PDOException $e) {
        response(['error' => 'Error al eliminar empleado: ' . $e->getMessage()], 500);
    }
}
