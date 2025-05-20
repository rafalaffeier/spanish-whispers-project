
<?php
// Funciones de utilidad para la API

// Función para generar UUID v4 (SOLO aquí, no duplicar en otros archivos)
function generateUUID() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

// Otras funciones de utilidad que puedan necesitarse

function getEmpleadosDeEmpresaAutenticada() {
    $userId = getAuthenticatedUser();
    if (!$userId) {
        response(['error' => 'No autorizado'], 401);
    }

    $db = getConnection();

    // Obtener empresa del usuario autenticado
    $stmt = $db->prepare("SELECT empresa_id FROM empleados WHERE id = ?");
    $stmt->execute([$userId]);
    $empresaId = $stmt->fetchColumn();

    if (!$empresaId) {
        response(['error' => 'Empresa no encontrada para este usuario'], 404);
    }

    // Obtener empleados de esa empresa
    $stmt = $db->prepare("SELECT * FROM empleados WHERE empresa_id = ?");
    $stmt->execute([$empresaId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

