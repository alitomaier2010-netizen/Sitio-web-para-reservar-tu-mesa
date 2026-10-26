<?php
// POST api/auth/logout.php
require_once __DIR__ . '/../session.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  json_error('Usá POST', 405);
}
check_mismo_origen();

cerrar_sesion();
json_out(['ok' => true, 'autenticado' => false]);
