
<?php
// Main auth file that includes all other auth files

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../utils.php'; // Aseguramos cargar utils.php solo una vez
require_once __DIR__ . '/utils.php';
require_once __DIR__ . '/login.php';
require_once __DIR__ . '/register.php';
require_once __DIR__ . '/password_reset.php';
