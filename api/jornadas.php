<?php
require_once 'config.php';

$userId = getAuthenticatedUser();
if (!$userId) {
    response(['error' => 'No autorizado'], 401);
}

// Obtener empresa_id del usuario autenticado
$db = getConnection();
$stmt = $db->prepare("SELECT empresa_id FROM empleados WHERE id = ?");
$stmt->execute([$userId]);
$empresaAutenticada = $stmt->fetchColumn();

// Verificar que el empleado solicitado pertenece a esa empresa
$empleadoId = $_GET['empleado_id'] ?? null;
$stmt = $db->prepare("SELECT COUNT(*) FROM empleados WHERE id = ? AND empresa_id = ?");
$stmt->execute([$empleadoId, $empresaAutenticada]);
if ($stmt->fetchColumn() == 0) {
    response(['error' => 'Acceso denegado: empleado no pertenece a tu empresa'], 403);
}


$method = $_SERVER['REQUEST_METHOD'];
$jornadaId = isset($_GET['id']) ? $_GET['id'] : null;
$action = isset($_GET['action']) ? $_GET['action'] : null;

switch ($method) {
    case 'GET':
        if ($jornadaId) {
            getJornada($jornadaId);
        } else if (isset($_GET['empleado_id'])) {
            getJornadasByEmpleado($_GET['empleado_id']);
        } else {
            getJornadas();
        }
        break;
    case 'POST':
        if ($action == 'iniciar') {
            iniciarJornada();
        } else if ($action == 'pausar') {
            pausarJornada();
        } else if ($action == 'reanudar') {
            reanudarJornada();
        } else if ($action == 'finalizar') {
            finalizarJornada();
        } else {
            createJornada();
        }
        break;
    case 'PUT':
        if (!$jornadaId) {
            response(['error' => 'ID de jornada no proporcionado'], 400);
        }
        updateJornada($jornadaId);
        break;
    case 'DELETE':
        if (!$jornadaId) {
            response(['error' => 'ID de jornada no proporcionado'], 400);
        }
        deleteJornada($jornadaId);
        break;
    default:
        response(['error' => 'Método no permitido'], 405);
}

function getJornadas() {
    try {
        $db = getConnection();
        
        $conditions = [];
        $params = [];
        
        // Filtros
        if (isset($_GET['fecha'])) {
            $conditions[] = "fecha = ?";
            $params[] = $_GET['fecha'];
        }
        
        if (isset($_GET['estado'])) {
            $conditions[] = "estado = ?";
            $params[] = $_GET['estado'];
        }
        
        $whereClause = '';
        if (!empty($conditions)) {
            $whereClause = "WHERE " . implode(' AND ', $conditions);
        }
        
        $query = "SELECT j.*, e.nombre as empleado_nombre 
                 FROM jornadas j 
                 LEFT JOIN empleados e ON j.empleado_id = e.id 
                 $whereClause 
                 ORDER BY j.fecha DESC, j.hora_inicio DESC";
        
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $jornadas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Añadir pausas a las jornadas
        foreach ($jornadas as &$jornada) {
            $stmt = $db->prepare('SELECT * FROM pausas WHERE jornada_id = ?');
            $stmt->execute([$jornada['id']]);
            $jornada['pausas'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Añadir ubicaciones
            $stmt = $db->prepare('SELECT * FROM ubicaciones WHERE jornada_id = ?');
            $stmt->execute([$jornada['id']]);
            $jornada['ubicaciones'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
        response($jornadas);
    } catch (PDOException $e) {
        response(['error' => 'Error al obtener jornadas: ' . $e->getMessage()], 500);
    }
}

function getJornada($id) {
    try {
        $db = getConnection();
        $stmt = $db->prepare('SELECT j.*, e.nombre as empleado_nombre 
                             FROM jornadas j 
                             LEFT JOIN empleados e ON j.empleado_id = e.id 
                             WHERE j.id = ?');
        $stmt->execute([$id]);
        $jornada = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$jornada) {
            response(['error' => 'Jornada no encontrada'], 404);
        }
        
        // Añadir pausas
        $stmt = $db->prepare('SELECT * FROM pausas WHERE jornada_id = ?');
        $stmt->execute([$id]);
        $jornada['pausas'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Añadir ubicaciones
        $stmt = $db->prepare('SELECT * FROM ubicaciones WHERE jornada_id = ?');
        $stmt->execute([$id]);
        $jornada['ubicaciones'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        response($jornada);
    } catch (PDOException $e) {
        response(['error' => 'Error al obtener jornada: ' . $e->getMessage()], 500);
    }
}

function getJornadasByEmpleado($empleadoId) {
    try {
        $db = getConnection();
        
        // Verificar si el empleado existe
        $checkStmt = $db->prepare('SELECT id FROM empleados WHERE id = ?');
        $checkStmt->execute([$empleadoId]);
        if (!$checkStmt->fetch()) {
            response(['error' => 'Empleado no encontrado'], 404);
        }
        
        $conditions = ["empleado_id = ?"];
        $params = [$empleadoId];
        
        // Filtros adicionales
        if (isset($_GET['fecha'])) {
            $conditions[] = "fecha = ?";
            $params[] = $_GET['fecha'];
        }
        
        if (isset($_GET['estado'])) {
            $conditions[] = "estado = ?";
            $params[] = $_GET['estado'];
        }
        
        $whereClause = "WHERE " . implode(' AND ', $conditions);
        
        $query = "SELECT * FROM jornadas $whereClause ORDER BY fecha DESC, hora_inicio DESC";
        
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $jornadas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Añadir pausas a las jornadas
        foreach ($jornadas as &$jornada) {
            $stmt = $db->prepare('SELECT * FROM pausas WHERE jornada_id = ?');
            $stmt->execute([$jornada['id']]);
            $jornada['pausas'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Añadir ubicaciones
            $stmt = $db->prepare('SELECT * FROM ubicaciones WHERE jornada_id = ?');
            $stmt->execute([$jornada['id']]);
            $jornada['ubicaciones'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
        response($jornadas);
    } catch (PDOException $e) {
        response(['error' => 'Error al obtener jornadas: ' . $e->getMessage()], 500);
    }
}

function iniciarJornada() {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['empleado_id'])) {
            response(['error' => 'ID de empleado no proporcionado'], 400);
        }
        
        $db = getConnection();
        
        // Verificar si ya existe una jornada activa para hoy
        $fecha = date('Y-m-d');
        $stmt = $db->prepare('SELECT id, estado FROM jornadas WHERE empleado_id = ? AND fecha = ?');
        $stmt->execute([$data['empleado_id'], $fecha]);
        $jornadaExistente = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($jornadaExistente) {
            if ($jornadaExistente['estado'] != 'no_iniciada') {
                response(['error' => 'Ya existe una jornada activa para hoy'], 400);
            }
            $jornadaId = $jornadaExistente['id'];
        } else {
            // Crear nueva jornada
            $jornadaId = generateUUID();
            $stmt = $db->prepare('INSERT INTO jornadas (id, empleado_id, fecha, estado) VALUES (?, ?, ?, ?)');
            $stmt->execute([$jornadaId, $data['empleado_id'], $fecha, 'no_iniciada']);
        }
        
        // Iniciar la jornada
        $horaInicio = date('Y-m-d H:i:s');
        $ip = $_SERVER['REMOTE_ADDR'] ?? '';
        $dispositivo = $data['dispositivo'] ?? '';
        
        $stmt = $db->prepare('UPDATE jornadas SET hora_inicio = ?, estado = ?, ip_inicio = ?, dispositivo_inicio = ? WHERE id = ?');
        $stmt->execute([$horaInicio, 'activa', $ip, $dispositivo, $jornadaId]);
        
        // Registrar ubicación si se proporcionó
        if (isset($data['ubicacion']) && !empty($data['ubicacion'])) {
            $lat = $data['ubicacion']['latitud'] ?? 0;
            $lng = $data['ubicacion']['longitud'] ?? 0;
            $precision = $data['ubicacion']['precision'] ?? 0;
            
            $stmt = $db->prepare('INSERT INTO ubicaciones (jornada_id, tipo, latitud, longitud, precision_gps, timestamp) VALUES (?, ?, ?, ?, ?, ?)');
            $stmt->execute([$jornadaId, 'inicio', $lat, $lng, $precision, $horaInicio]);
        }
        
        logAction($data['empleado_id'], 'iniciar_jornada', "Jornada: $jornadaId");
        response([
            'id' => $jornadaId, 
            'hora_inicio' => $horaInicio,
            'message' => 'Jornada iniciada correctamente'
        ]);
    } catch (PDOException $e) {
        response(['error' => 'Error al iniciar jornada: ' . $e->getMessage()], 500);
    }
}

function pausarJornada() {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['jornada_id']) || !isset($data['motivo'])) {
            response(['error' => 'Datos incompletos'], 400);
        }
        
        $jornadaId = $data['jornada_id'];
        $db = getConnection();
        
        // Verificar que la jornada existe y está activa
        $stmt = $db->prepare('SELECT id, empleado_id, estado FROM jornadas WHERE id = ?');
        $stmt->execute([$jornadaId]);
        $jornada = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$jornada) {
            response(['error' => 'Jornada no encontrada'], 404);
        }
        
        if ($jornada['estado'] != 'activa') {
            response(['error' => 'La jornada no está activa'], 400);
        }
        
        // Registrar hora de pausa
        $horaPausa = date('Y-m-d H:i:s');
        
        // Cambiar estado de la jornada
        $stmt = $db->prepare('UPDATE jornadas SET estado = ? WHERE id = ?');
        $stmt->execute(['pausada', $jornadaId]);
        
        // Crear registro de pausa
        $stmt = $db->prepare('INSERT INTO pausas (jornada_id, motivo, hora_inicio) VALUES (?, ?, ?)');
        $stmt->execute([$jornadaId, $data['motivo'], $horaPausa]);
        $pausaId = $db->lastInsertId();
        
        // Registrar ubicación si se proporcionó
        if (isset($data['ubicacion']) && !empty($data['ubicacion'])) {
            $lat = $data['ubicacion']['latitud'] ?? 0;
            $lng = $data['ubicacion']['longitud'] ?? 0;
            $precision = $data['ubicacion']['precision'] ?? 0;
            
            $stmt = $db->prepare('INSERT INTO ubicaciones (jornada_id, tipo, latitud, longitud, precision_gps, timestamp) VALUES (?, ?, ?, ?, ?, ?)');
            $stmt->execute([$jornadaId, 'pausa_inicio', $lat, $lng, $precision, $horaPausa]);
        }
        
        logAction($jornada['empleado_id'], 'pausar_jornada', "Jornada: $jornadaId, Pausa: $pausaId");
        response([
            'id' => $pausaId,
            'hora_inicio' => $horaPausa,
            'message' => 'Jornada pausada correctamente'
        ]);
    } catch (PDOException $e) {
        response(['error' => 'Error al pausar jornada: ' . $e->getMessage()], 500);
    }
}

function reanudarJornada() {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['jornada_id'])) {
            response(['error' => 'ID de jornada no proporcionado'], 400);
        }
        
        $jornadaId = $data['jornada_id'];
        $db = getConnection();
        
        // Verificar que la jornada existe y está en pausa
        $stmt = $db->prepare('SELECT id, empleado_id, estado FROM jornadas WHERE id = ?');
        $stmt->execute([$jornadaId]);
        $jornada = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$jornada) {
            response(['error' => 'Jornada no encontrada'], 404);
        }
        
        if ($jornada['estado'] != 'pausada') {
            response(['error' => 'La jornada no está pausada'], 400);
        }
        
        // Encontrar la última pausa sin finalizar
        $stmt = $db->prepare('SELECT id FROM pausas WHERE jornada_id = ? AND hora_fin IS NULL ORDER BY hora_inicio DESC LIMIT 1');
        $stmt->execute([$jornadaId]);
        $pausa = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$pausa) {
            response(['error' => 'No se encontró una pausa activa'], 400);
        }
        
        $pausaId = $pausa['id'];
        $horaReanudacion = date('Y-m-d H:i:s');
        
        // Actualizar la pausa con la hora de fin
        $stmt = $db->prepare('UPDATE pausas SET hora_fin = ?, duracion = TIMESTAMPDIFF(SECOND, hora_inicio, ?) WHERE id = ?');
        $stmt->execute([$horaReanudacion, $horaReanudacion, $pausaId]);
        
        // Cambiar estado de la jornada
        $stmt = $db->prepare('UPDATE jornadas SET estado = ? WHERE id = ?');
        $stmt->execute(['activa', $jornadaId]);
        
        // Registrar ubicación si se proporcionó
        if (isset($data['ubicacion']) && !empty($data['ubicacion'])) {
            $lat = $data['ubicacion']['latitud'] ?? 0;
            $lng = $data['ubicacion']['longitud'] ?? 0;
            $precision = $data['ubicacion']['precision'] ?? 0;
            
            $stmt = $db->prepare('INSERT INTO ubicaciones (jornada_id, tipo, latitud, longitud, precision_gps, timestamp) VALUES (?, ?, ?, ?, ?, ?)');
            $stmt->execute([$jornadaId, 'pausa_fin', $lat, $lng, $precision, $horaReanudacion]);
        }
        
        logAction($jornada['empleado_id'], 'reanudar_jornada', "Jornada: $jornadaId, Pausa: $pausaId");
        response([
            'id' => $jornadaId,
            'hora_reanudacion' => $horaReanudacion,
            'message' => 'Jornada reanudada correctamente'
        ]);
    } catch (PDOException $e) {
        response(['error' => 'Error al reanudar jornada: ' . $e->getMessage()], 500);
    }
}

function finalizarJornada() {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['jornada_id'])) {
            response(['error' => 'ID de jornada no proporcionado'], 400);
        }
        
        $jornadaId = $data['jornada_id'];
        $firma = $data['firma'] ?? null;
        $db = getConnection();
        
        // Verificar que la jornada existe y no está finalizada
        $stmt = $db->prepare('SELECT j.id, j.empleado_id, j.estado, j.hora_inicio FROM jornadas j WHERE j.id = ?');
        $stmt->execute([$jornadaId]);
        $jornada = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$jornada) {
            response(['error' => 'Jornada no encontrada'], 404);
        }
        
        if ($jornada['estado'] == 'finalizada') {
            response(['error' => 'La jornada ya está finalizada'], 400);
        }
        
        // Si está en pausa, finalizar la última pausa
        if ($jornada['estado'] == 'pausada') {
            $stmt = $db->prepare('SELECT id FROM pausas WHERE jornada_id = ? AND hora_fin IS NULL ORDER BY hora_inicio DESC LIMIT 1');
            $stmt->execute([$jornadaId]);
            $pausa = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($pausa) {
                $horaFin = date('Y-m-d H:i:s');
                $stmt = $db->prepare('UPDATE pausas SET hora_fin = ?, duracion = TIMESTAMPDIFF(SECOND, hora_inicio, ?) WHERE id = ?');
                $stmt->execute([$horaFin, $horaFin, $pausa['id']]);
            }
        }
        
        // Finalizar jornada
        $horaFin = date('Y-m-d H:i:s');
        $ip = $_SERVER['REMOTE_ADDR'] ?? '';
        $dispositivo = $data['dispositivo'] ?? '';
        
        // Calcular duración total (restando pausas)
        $duracion = calcularDuracionTotal($db, $jornadaId, $jornada['hora_inicio'], $horaFin);
        
        $stmt = $db->prepare('UPDATE jornadas SET hora_fin = ?, duracion_total = ?, firma = ?, estado = ?, ip_fin = ?, dispositivo_fin = ? WHERE id = ?');
        $stmt->execute([$horaFin, $duracion, $firma, 'finalizada', $ip, $dispositivo, $jornadaId]);
        
        // Registrar ubicación si se proporcionó
        if (isset($data['ubicacion']) && !empty($data['ubicacion'])) {
            $lat = $data['ubicacion']['latitud'] ?? 0;
            $lng = $data['ubicacion']['longitud'] ?? 0;
            $precision = $data['ubicacion']['precision'] ?? 0;
            
            $stmt = $db->prepare('INSERT INTO ubicaciones (jornada_id, tipo, latitud, longitud, precision_gps, timestamp) VALUES (?, ?, ?, ?, ?, ?)');
            $stmt->execute([$jornadaId, 'fin', $lat, $lng, $precision, $horaFin]);
        }
        
        logAction($jornada['empleado_id'], 'finalizar_jornada', "Jornada: $jornadaId");
        response([
            'id' => $jornadaId,
            'hora_fin' => $horaFin,
            'duracion_total' => $duracion,
            'message' => 'Jornada finalizada correctamente'
        ]);
    } catch (PDOException $e) {
        response(['error' => 'Error al finalizar jornada: ' . $e->getMessage()], 500);
    }
}

function updateJornada($id) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $db = getConnection();
        
        // Verificar que la jornada existe
        $stmt = $db->prepare('SELECT empleado_id, estado FROM jornadas WHERE id = ?');
        $stmt->execute([$id]);
        $jornada = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$jornada) {
            response(['error' => 'Jornada no encontrada'], 404);
        }
        
        // Preparar campos a actualizar
        $fields = [];
        $params = [];
        
        $allowedFields = ['hora_inicio', 'hora_fin', 'firma', 'estado'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (empty($fields)) {
            response(['error' => 'No se proporcionaron campos para actualizar'], 400);
        }
        
        // Si se actualizan hora_inicio o hora_fin, recalcular duración
        if (isset($data['hora_inicio']) || isset($data['hora_fin'])) {
            // Obtener valores actuales si no se proporcionaron
            if (!isset($data['hora_inicio'])) {
                $stmt = $db->prepare('SELECT hora_inicio FROM jornadas WHERE id = ?');
                $stmt->execute([$id]);
                $result = $stmt->fetch(PDO::FETCH_ASSOC);
                $horaInicio = $result['hora_inicio'];
            } else {
                $horaInicio = $data['hora_inicio'];
            }
            
            if (!isset($data['hora_fin'])) {
                $stmt = $db->prepare('SELECT hora_fin FROM jornadas WHERE id = ?');
                $stmt->execute([$id]);
                $result = $stmt->fetch(PDO::FETCH_ASSOC);
                $horaFin = $result['hora_fin'];
            } else {
                $horaFin = $data['hora_fin'];
            }
            
            if ($horaInicio && $horaFin) {
                $duracion = calcularDuracionTotal($db, $id, $horaInicio, $horaFin);
                $fields[] = "duracion_total = ?";
                $params[] = $duracion;
            }
        }
        
        // Añadir el ID al final de los parámetros
        $params[] = $id;
        
        $sql = 'UPDATE jornadas SET ' . implode(', ', $fields) . ' WHERE id = ?';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        
        logAction($jornada['empleado_id'], 'actualizar_jornada', "Jornada: $id");
        response(['message' => 'Jornada actualizada correctamente']);
    } catch (PDOException $e) {
        response(['error' => 'Error al actualizar jornada: ' . $e->getMessage()], 500);
    }
}

function deleteJornada($id) {
    try {
        $db = getConnection();
        
        // Verificar que la jornada existe
        $stmt = $db->prepare('SELECT empleado_id FROM jornadas WHERE id = ?');
        $stmt->execute([$id]);
        $jornada = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$jornada) {
            response(['error' => 'Jornada no encontrada'], 404);
        }
        
        // Eliminar pausas asociadas
        $stmt = $db->prepare('DELETE FROM pausas WHERE jornada_id = ?');
        $stmt->execute([$id]);
        
        // Eliminar ubicaciones asociadas
        $stmt = $db->prepare('DELETE FROM ubicaciones WHERE jornada_id = ?');
        $stmt->execute([$id]);
        
        // Eliminar la jornada
        $stmt = $db->prepare('DELETE FROM jornadas WHERE id = ?');
        $stmt->execute([$id]);
        
        logAction($jornada['empleado_id'], 'eliminar_jornada', "Jornada: $id");
        response(['message' => 'Jornada eliminada correctamente']);
    } catch (PDOException $e) {
        response(['error' => 'Error al eliminar jornada: ' . $e->getMessage()], 500);
    }
}

function createJornada() {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['empleado_id']) || !isset($data['fecha'])) {
            response(['error' => 'Datos incompletos'], 400);
        }
        
        // Generar ID único
        $id = generateUUID();
        
        $db = getConnection();
        $stmt = $db->prepare('INSERT INTO jornadas (id, empleado_id, fecha, estado) VALUES (?, ?, ?, ?)');
        $stmt->execute([
            $id,
            $data['empleado_id'],
            $data['fecha'],
            'no_iniciada'
        ]);
        
        logAction($data['empleado_id'], 'crear_jornada', "Jornada: $id");
        response([
            'id' => $id, 
            'message' => 'Jornada creada correctamente'
        ]);
    } catch (PDOException $e) {
        response(['error' => 'Error al crear jornada: ' . $e->getMessage()], 500);
    }
}

// Función para calcular la duración total de una jornada, restando pausas
function calcularDuracionTotal($db, $jornadaId, $horaInicio, $horaFin) {
    // Obtener todas las pausas
    $stmt = $db->prepare('SELECT hora_inicio, hora_fin, duracion FROM pausas WHERE jornada_id = ?');
    $stmt->execute([$jornadaId]);
    $pausas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calcular duración total en segundos
    $inicio = strtotime($horaInicio);
    $fin = strtotime($horaFin);
    $duracionTotal = $fin - $inicio;
    
    // Restar tiempo de pausas
    foreach ($pausas as $pausa) {
        if ($pausa['duracion']) {
            $duracionTotal -= $pausa['duracion'];
        } else if ($pausa['hora_fin']) {
            $pausaInicio = strtotime($pausa['hora_inicio']);
            $pausaFin = strtotime($pausa['hora_fin']);
            $duracionTotal -= ($pausaFin - $pausaInicio);
        }
    }
    
    return max(0, $duracionTotal);
}

