
<?php
// Endpoint simple para probar CORS y PHP
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Max-Age: 86400');
header('Content-Type: application/json; charset=utf-8');
echo json_encode(['status' => 'ok', 'msg' => 'PHP está funcionando y CORS correcto']);
exit;
