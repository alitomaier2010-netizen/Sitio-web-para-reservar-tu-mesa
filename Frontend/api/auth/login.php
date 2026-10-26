<?php
// POST api/auth/login.php
// Body: { email, password }
// Valida contra el hash guardado y abre la sesión.
require_once __DIR__ . '/../session.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  json_error('Usá POST', 405);
}
check_mismo_origen();

$b = body_json();
$email = mb_strtolower(trim((string)($b['email'] ?? '')));
// Además del correo completo, aceptamos el usuario corto de la cuenta admin
// (por ejemplo "alitopro2010" en vez de "alitopro2010@nonstop.local").
if ($email !== '' && strpos($email, '@') === false) {
  $email .= '@nonstop.local';
}
$pass = (string)($b['password'] ?? '');

if ($email === '' || $pass === '') {
  json_error('Completá correo y contraseña', 400);
}

// Mismo mensaje para correo inexistente y contraseña incorrecta: no le
// contamos a nadie qué correos están registrados.
$generico = 'Correo o contraseña incorrectos';

rate_limit('login', $email, 8, 15);

// Hash de relleno para que un correo inexistente tarde lo mismo que uno real.
const HASH_RELLENO = '$2y$10$P2Haj3NMWzlgtoLDMVSl8urBCmgD0XsdcwWLy73pkfC5KGXW.x0Uq';

$st = db()->prepare('
  SELECT id, email, nombre_completo, password_hash, rol, activo
  FROM usuarios
  WHERE email = ?
');
$st->execute([$email]);
$u = $st->fetch();

if (!$u) {
  password_verify($pass, HASH_RELLENO);
  registrar_intento('login', $email, false);
  json_error($generico, 401);
}

if (!password_verify($pass, $u['password_hash'])) {
  registrar_intento('login', $email, false);
  json_error($generico, 401);
}

if (!(bool)$u['activo']) {
  registrar_intento('login', $email, false);
  json_error($generico, 401);
}

// Actualiza el hash si PHP cambió el algoritmo por defecto.
if (password_needs_rehash($u['password_hash'], PASSWORD_DEFAULT)) {
  $nuevo = password_hash($pass, PASSWORD_DEFAULT);
  if ($nuevo !== false) {
    $up = db()->prepare('UPDATE usuarios SET password_hash = ? WHERE id = ?');
    $up->execute([$nuevo, $u['id']]);
  }
}

db()->prepare('UPDATE usuarios SET ultimo_login = NOW() WHERE id = ?')->execute([$u['id']]);

sesion_iniciar();
session_regenerate_id(true);
$_SESSION['usuario_id'] = (int)$u['id'];
registrar_intento('login', $email, true);

json_out([
  'ok' => true,
  'autenticado' => true,
  'usuario' => usuario_publico($u),
]);
