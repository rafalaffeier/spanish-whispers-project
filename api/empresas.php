
<?php
// Endpoint para operaciones con empresas
require_once 'config.php';

// Configurar las cabeceras CORS para permitir solicitudes desde cualquier origen
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Si es una solicitud OPTIONS, terminar aquí (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Si es una solicitud GET y tiene un parámetro 'nif', es una verificación de empresa
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['nif'])) {
    handleCompanyVerification($_GET['nif']);
} else {
    // Otras operaciones con empresas según el método
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            getEmpresas();
            break;
        case 'POST':
            // Crear empresa (si se necesita)
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido']);
            break;
    }
}

// Función para verificar si existe una empresa con un NIF específico
function handleCompanyVerification($nif) {
    error_log("Verificando empresa con NIF: $nif");
    
    if (empty($nif)) {
        http_response_code(400);
        echo json_encode(['error' => 'NIF no proporcionado']);
        return;
    }
    
    try {
        $db = getConnection();
        
        // Normalizar el NIF (eliminar espacios, guiones, etc.)
        $nif = preg_replace('/[^A-Z0-9]/i', '', strtoupper($nif));
        error_log("NIF normalizado para búsqueda: $nif");
        
        $stmt = $db->prepare('SELECT id, nombre FROM empresas WHERE nif = ?');
        $stmt->execute([$nif]);
        $empresa = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($empresa) {
            // Empresa encontrada
            error_log("Empresa encontrada con NIF $nif: " . $empresa['nombre']);
            echo json_encode([$empresa]);
        } else {
            // Empresa no encontrada
            error_log("No se encontró ninguna empresa con NIF: $nif");
            echo json_encode([]);
        }
    } catch (PDOException $e) {
        error_log("Error al verificar empresa: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Error al consultar la base de datos']);
    }
}

// Función para obtener lista de empresas
function getEmpresas() {
    try {
        $db = getConnection();
        $stmt = $db->query('SELECT id, nombre, nif FROM empresas');
        $empresas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode($empresas);
    } catch (PDOException $e) {
        error_log("Error al obtener empresas: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Error al consultar la base de datos']);
    }
}
