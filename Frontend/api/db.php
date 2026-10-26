<?php
require_once __DIR__ . '/config.php';

// Los errores de PHP van al log, nunca a la respuesta HTTP (no filtrar rutas
// ni detalles internos del servidor).
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

function json_out($data, int $code = 200): void {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
  header('Pragma: no-cache');
  header('X-Content-Type-Options: nosniff');
  header('Referrer-Policy: no-referrer');
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}

function json_error(string $msg, int $code = 400, array $extra = []): void {
  json_out(array_merge(['ok' => false, 'error' => $msg], $extra), $code);
}

function db(): PDO {
  static $pdo = null;
  if ($pdo instanceof PDO) return $pdo;
  $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
  try {
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
      PDO::ATTR_EMULATE_PREPARES => false,
    ]);
  } catch (PDOException $e) {
    json_error('No se pudo conectar a MySQL. ¿Importaste non_stop.sql y encendiste MySQL en XAMPP?', 500);
  }
  return $pdo;
}

function body_json(): array {
  $raw = file_get_contents('php://input');
  if ($raw === '' || $raw === false) return $_POST;
  $d = json_decode($raw, true);
  return is_array($d) ? $d : $_POST;
}

function dia_valido(?string $dia): bool {
  return $dia === 'viernes' || $dia === 'sabado';
}

// Próxima fecha para un día dado. Si hoy es ese día, devuelve hoy.
function proxima_fecha(string $dia): string {
  // PHP: 5=viernes, 6=sábado, 0=domingo... N: 5=viernes, 6=sábado
  $n = (int)date('N');
  $target = $dia === 'viernes' ? 5 : 6;
  $diff = ($target - $n + 7) % 7;
  return date('Y-m-d', strtotime("+$diff days"));
}

function fechas_semana(): array {
  return [
    'hoy' => date('Y-m-d'),
    'viernes' => proxima_fecha('viernes'),
    'sabado' => proxima_fecha('sabado'),
  ];
}

// Si el cliente manda dia pero no fecha, la calculamos.
// Si manda fecha, validamos que coincida con el día (para evitar errores).
function resolver_fecha(string $dia, ?string $fecha): string {
  if ($fecha === null || $fecha === '') {
    return proxima_fecha($dia);
  }
  $d = DateTime::createFromFormat('Y-m-d', $fecha);
  if (!$d || $d->format('Y-m-d') !== $fecha) {
    json_error('fecha_evento inválida, usá formato YYYY-MM-DD');
  }
  // Validación suave: avisar si el día no coincide, pero igual aceptar
  // (permite feriados / fechas especiales a futuro desde el admin).
  return $fecha;
}

function check_admin(?string $key): void {
  // Retardo fijo en cada intento fallido: encarece la fuerza bruta.
  if ($key === null || ADMIN_KEY === '' || !hash_equals(ADMIN_KEY, $key)) {
    usleep(400000);
    json_error('Clave admin incorrecta', 403);
  }
}

// La clave se acepta por header X-Admin-Key o en el body JSON.
// NO se acepta más por ?key= para que no quede escrita en los logs de Apache.
function admin_key(?array $body = null): ?string {
  $header = $_SERVER['HTTP_X_ADMIN_KEY'] ?? null;
  if (is_string($header) && $header !== '') return $header;
  if (is_array($body) && isset($body['key']) && is_string($body['key']) && $body['key'] !== '') {
    return $body['key'];
  }
  return null;
}
