<?php
// Configuración Non Stop.
//
// Los valores sensibles (contraseña de MySQL y clave del panel admin) viven en
// config.local.php, que NO se sube al repositorio. Si ese archivo no existe, se
// usan estos valores por defecto (solo sirven para un XAMPP recién instalado).
//
// Para poner el sitio en marcha: copiá config.example.php a config.local.php y
// completá DB_PASS y ADMIN_KEY.

$configLocal = __DIR__ . '/config.local.php';
if (is_file($configLocal)) {
    require_once $configLocal;
}

if (!defined('DB_HOST')) define('DB_HOST', '127.0.0.1');
if (!defined('DB_NAME')) define('DB_NAME', 'non_stop');
if (!defined('DB_USER')) define('DB_USER', 'root');
if (!defined('DB_PASS')) define('DB_PASS', '');
if (!defined('DB_CHARSET')) define('DB_CHARSET', 'utf8mb4');

// Si no hay clave local, el panel admin queda deshabilitado (clave imposible).
if (!defined('ADMIN_KEY')) define('ADMIN_KEY', 'CAMBIAR_EN_config.local.php');

if (!defined('PUBLIC_NOMBRE')) define('PUBLIC_NOMBRE', 'Aramis');
if (!defined('PUBLIC_INSTAGRAM')) define('PUBLIC_INSTAGRAM', 'ara.nonstop');

// El boliche y la base trabajan en hora de Argentina. Sin esto, PHP usa la
// zona horaria de php.ini (acá estaba en Europe/Berlin) y las fechas de las
// reservas y las ventanas de los límites de intentos quedaban corridas.
date_default_timezone_set('America/Argentina/Buenos_Aires');
