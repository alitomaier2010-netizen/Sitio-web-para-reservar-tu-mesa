<?php
// Sesiones y helpers de autenticación.
require_once __DIR__ . '/db.php';

const SESION_DIAS = 30;
const SESION_NOMBRE = 'NS_SESION';

function sesion_iniciar(): void {
  if (session_status() === PHP_SESSION_ACTIVE) return;

  $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

  ini_set('session.use_strict_mode', '1');
  ini_set('session.use_only_cookies', '1');
  ini_set('session.gc_maxlifetime', (string)(SESION_DIAS * 86400));

  session_name(SESION_NOMBRE);
  session_set_cookie_params([
    'lifetime' => SESION_DIAS * 86400,
    'path' => '/',
    'domain' => '',
    'secure' => $https,
    'httponly' => true,
    'samesite' => 'Lax',
  ]);
  session_start();
}

function usuario_actual(): ?array {
  sesion_iniciar();
  if (empty($_SESSION['usuario_id'])) return null;

  $st = db()->prepare('
    SELECT id, email, nombre_completo, rol, creado_en, ultimo_login
    FROM usuarios
    WHERE id = ? AND activo = TRUE
  ');
  $st->execute([(int)$_SESSION['usuario_id']]);
  $u = $st->fetch();

  if (!$u) {
    $_SESSION = [];
    return null;
  }
  $u['id'] = (int)$u['id'];
  return $u;
}

function usuario_id_actual(): ?int {
  $u = usuario_actual();
  return $u ? (int)$u['id'] : null;
}

function cerrar_sesion(): void {
  sesion_iniciar();
  $_SESSION = [];
  if (ini_get('session.use_cookies')) {
    $p = session_get_cookie_params();
    setcookie(SESION_NOMBRE, '', [
      'expires' => time() - 42000,
      'path' => $p['path'] ?: '/',
      'domain' => $p['domain'] ?? '',
      'secure' => (bool)($p['secure'] ?? false),
      'httponly' => true,
      'samesite' => 'Lax',
    ]);
  }
  session_destroy();
}

// Bloquea POST de otro origen (CSRF). Los clientes que no son navegador
// (curl, scripts) no mandan Origin; para ellos no hay CSRF posible.
function check_mismo_origen(): void {
  $origen = $_SERVER['HTTP_ORIGIN'] ?? '';
  $referer = $_SERVER['HTTP_REFERER'] ?? '';
  $fuente = $origen !== '' ? $origen : $referer;
  if ($fuente === '') return;

  $host = strtolower((string)($_SERVER['HTTP_HOST'] ?? ''));
  $host = preg_replace('/:\d+$/', '', $host);
  $p = parse_url($fuente);
  $origenHost = strtolower((string)($p['host'] ?? ''));

  if ($origenHost === '' || !hash_equals($host, $origenHost)) {
    json_error('Origen no permitido', 403);
  }
}

function ip_cliente(): string {
  return substr((string)($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0'), 0, 45);
}

// Cuenta intentos recientes por IP o email. $soloFallos = TRUE cuenta solo
// los intentos fallidos (login), FALSE cuenta todos (reservas, consumos).
function rate_limit(string $accion, string $email, int $maximo, int $ventanaMin, bool $soloFallos = true): void {
  $pdo = db();

  // Limpieza oportunista de registros viejos.
  if (random_int(1, 25) === 1) {
    $pdo->exec('DELETE FROM auth_intentos WHERE creado_en < (NOW() - INTERVAL 2 DAY)');
  }

  // Comparamos con NOW() de MySQL, no con la hora de PHP: así la ventana no se
  // rompe si el servidor web y MySQL tienen zonas horarias distintas.
  $sql = 'SELECT COUNT(*) AS n FROM auth_intentos
          WHERE accion = ? AND creado_en > (NOW() - INTERVAL ? MINUTE) AND (ip = ?';
  $params = [$accion, $ventanaMin, ip_cliente()];
  if ($email !== '') {
    $sql .= ' OR email = ?';
    $params[] = $email;
  }
  $sql .= ')';
  if ($soloFallos) {
    $sql .= ' AND exito = FALSE';
  }

  $st = $pdo->prepare($sql);
  $st->execute($params);
  if ((int)$st->fetch()['n'] >= $maximo) {
    json_error('Demasiados intentos seguidos. Esperá unos minutos y volvé a probar.', 429);
  }

  // Reservas y consumos: registramos el intento antes de ejecutarlo, así el
  // límite también frena los pedidos que después fallan.
  if (!$soloFallos) {
    registrar_intento($accion, $email, true);
  }
}

function registrar_intento(string $accion, string $email, bool $exito): void {
  $st = db()->prepare('
    INSERT INTO auth_intentos (ip, email, accion, exito)
    VALUES (?, ?, ?, ?)
  ');
  $st->execute([ip_cliente(), mb_substr($email, 0, 190), $accion, $exito ? 1 : 0]);
}

// Normaliza y valida datos de cuenta. Devuelve [email, nombre] o corta con 400.
function validar_cuenta(array $b, bool $conPassword): array {
  $email = mb_strtolower(trim((string)($b['email'] ?? '')));
  $nombre = trim(preg_replace('/\s+/u', ' ', (string)($b['nombre_completo'] ?? '')));

  if ($email === '' || strlen($email) > 190 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_error('Escribí un correo electrónico válido', 400, ['campo' => 'email']);
  }
  if (preg_match('/[<>]/u', $email)) {
    json_error('El correo tiene caracteres no permitidos', 400, ['campo' => 'email']);
  }
  if (mb_strlen($nombre) < 2 || mb_strlen($nombre) > 100) {
    json_error('Escribí tu nombre completo (2 a 100 caracteres)', 400, ['campo' => 'nombre_completo']);
  }
  if (preg_match('/[<>]/u', $nombre)) {
    json_error('El nombre tiene caracteres no permitidos', 400, ['campo' => 'nombre_completo']);
  }

  if ($conPassword) {
    $pass = (string)($b['password'] ?? '');
    // bcrypt acepta hasta 72 bytes: más que eso se truncaría en silencio.
    if (strlen($pass) < 8) {
      json_error('La contraseña tiene que tener al menos 8 caracteres', 400, ['campo' => 'password']);
    }
    if (strlen($pass) > 72) {
      json_error('La contraseña no puede superar los 72 caracteres', 400, ['campo' => 'password']);
    }
  }

  return [$email, $nombre];
}

function usuario_publico(array $u): array {
  return [
    'id' => (int)$u['id'],
    'email' => $u['email'],
    'nombre_completo' => $u['nombre_completo'],
    'rol' => $u['rol'] ?? 'cliente',
  ];
}
