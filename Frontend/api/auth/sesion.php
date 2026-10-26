<?php
// GET api/auth/sesion.php
// Devuelve si hay una sesión abierta y los datos públicos de la cuenta.
require_once __DIR__ . '/../session.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  json_error('Usá GET', 405);
}

$u = usuario_actual();
json_out([
  'ok' => true,
  'autenticado' => $u !== null,
  'usuario' => $u ? usuario_publico($u) : null,
]);
