<?php
// POST api/auth/registro.php
// Body: { email, password, nombre_completo }
// Crea la cuenta, inicia sesión y devuelve el usuario.
require_once __DIR__ . '/../session.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  json_error('Usá POST', 405);
}
check_mismo_origen();

$b = body_json();
[$email, $nombre] = validar_cuenta($b, true);
$pass = (string)$b['password'];

// Registro: acá contamos TODOS los intentos (no solo los fallidos), para que
// nadie pueda crear cuentas en masa desde la misma IP.
rate_limit('registro', $email, 5, 60, false);

$st = db()->prepare('SELECT id FROM usuarios WHERE email = ?');
$st->execute([$email]);
if ($st->fetch()) {
  json_error('Ese correo ya tiene una cuenta. Probá iniciar sesión.', 409, ['campo' => 'email']);
}

$hash = password_hash($pass, PASSWORD_DEFAULT);
if ($hash === false) {
  json_error('No se pudo crear la cuenta', 500);
}

try {
  $st = db()->prepare('
    INSERT INTO usuarios (email, nombre_completo, password_hash)
    VALUES (?, ?, ?)
  ');
  $st->execute([$email, $nombre, $hash]);
  $id = (int)db()->lastInsertId();
} catch (PDOException $e) {
  if (($e->errorInfo[0] ?? '') === '23000') {
    json_error('Ese correo ya tiene una cuenta. Probá iniciar sesión.', 409, ['campo' => 'email']);
  }
  json_error('No se pudo crear la cuenta', 500);
}

sesion_iniciar();
session_regenerate_id(true);
$_SESSION['usuario_id'] = $id;

$st = db()->prepare('SELECT id, email, nombre_completo, rol FROM usuarios WHERE id = ?');
$st->execute([$id]);

json_out([
  'ok' => true,
  'autenticado' => true,
  'usuario' => usuario_publico($st->fetch()),
]);
