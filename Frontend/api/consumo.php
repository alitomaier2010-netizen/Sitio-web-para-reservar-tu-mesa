<?php
// "Salir - Consumo": se elige una ZONA (no una mesa) para pasar la noche.
//
// GET  api/consumo.php                      -> zonas disponibles + formas de pago
// POST api/consumo.php { zona_id, fecha_evento?, persona_nombre, persona_contacto,
//                        personas, consumo_base }
//
// No hay pago online: se registra el pedido y se devuelve un mensaje para
// coordinar por contacto. El costo adicional es un TOTAL de la zona
// (no se multiplica por la cantidad de personas).
require_once __DIR__ . '/session.php';

const CONSUMO_MAX_PERSONAS = 6;

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  $pdo = db();

  $zonas = $pdo->query("
    SELECT z.id, z.nombre, z.consumo_adicional, z.descripcion
    FROM zonas_consumo z
    WHERE z.activo = TRUE
    ORDER BY z.consumo_adicional DESC, z.nombre ASC
  ")->fetchAll();

  foreach ($zonas as &$z) {
    $z['consumo_adicional'] = (float)$z['consumo_adicional'];
  }
  unset($z);

  $formasPago = $pdo->query("
    SELECT nombre, detalle FROM formas_pago WHERE activo = TRUE ORDER BY orden ASC
  ")->fetchAll();

  json_out([
    'ok' => true,
    'zonas' => $zonas,
    'formas_pago' => $formasPago,
    'max_personas' => CONSUMO_MAX_PERSONAS,
    'fechas' => fechas_semana(),
    'instagram_url' => 'https://instagram.com/' . PUBLIC_INSTAGRAM,
  ]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  json_error('Usá GET o POST', 405);
}

check_mismo_origen();

$pdo = db();
$b = body_json();

$usuario = usuario_actual();
$usuario_id = $usuario ? (int)$usuario['id'] : null;

$zona_id     = (int)($b['zona_id'] ?? 0);
$nombre      = trim((string)($b['persona_nombre'] ?? ''));
$contacto    = trim((string)($b['persona_contacto'] ?? ''));
$personas    = (int)($b['personas'] ?? 1);
$consumo_in  = trim((string)($b['consumo_base'] ?? ''));
$fecha_in    = trim((string)($b['fecha_evento'] ?? ''));

if ($zona_id <= 0) {
  json_error('Elegí una zona');
}
if (mb_strlen($nombre) < 2 || mb_strlen($nombre) > 100) {
  json_error('Decinos tu nombre (2 a 100 caracteres)');
}
if (mb_strlen($contacto) < 3 || mb_strlen($contacto) > 100) {
  json_error('Dejanos un contacto (celular o Instagram)');
}
if (preg_match('/[<>]/u', $nombre . $contacto)) {
  json_error('El nombre o el contacto tienen caracteres no permitidos');
}
if ($personas < 1 || $personas > CONSUMO_MAX_PERSONAS) {
  json_error('Como maximo ' . CONSUMO_MAX_PERSONAS . ' personas por consumo');
}

// El consumo lo elige la persona, sin minimo. Solo tiene que ser > 0.
$consumo = (float)str_replace(['.', ','], ['', '.'], $consumo_in);
if ($consumo <= 0 || $consumo > 100000000) {
  json_error('Escribí el consumo que querés sacar (por ejemplo: 80000)');
}

// Fecha: el consumo es para la noche, no tiene viernes/sabado estricto.
$fecha_evento = $fecha_in === ''
  ? proxima_fecha('sabado')
  : $fecha_in;
$d = DateTime::createFromFormat('Y-m-d', $fecha_evento);
if (!$d || $d->format('Y-m-d') !== $fecha_evento) {
  json_error('fecha_evento invalida, usa formato YYYY-MM-DD');
}

// Ventana razonable: ni noches pasadas ni pedidos a 5 años vista.
if ($fecha_evento < date('Y-m-d')) {
  json_error('Esa fecha ya pasó. Elegí una noche próxima.');
}
if ($fecha_evento > date('Y-m-d', strtotime('+365 days'))) {
  json_error('Solo se puede sacar consumo con hasta un año de anticipación.');
}

// Freno anti-spam por IP o cuenta.
rate_limit('consumo', $usuario['email'] ?? '', 6, 10, false);

// Traemos la zona y calculamos el adicional en el servidor (nunca desde el cliente).
$st = $pdo->prepare("
  SELECT id, nombre, consumo_adicional
  FROM zonas_consumo
  WHERE id = ? AND activo = TRUE
");
$st->execute([$zona_id]);
$zona = $st->fetch();
if (!$zona) {
  json_error('Esa zona no esta disponible', 404);
}

$adicional = (float)$zona['consumo_adicional'];
$total = $consumo + $adicional;

try {
  $st = $pdo->prepare("
    INSERT INTO consumos
      (usuario_id, zona_id, fecha_evento, persona_nombre, persona_contacto, personas,
       consumo_base, costo_adicional, total, estado)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente')
  ");
  $st->execute([$usuario_id, $zona_id, $fecha_evento, $nombre, $contacto, $personas, $consumo, $adicional, $total]);
  $consumo_id = (int)$pdo->lastInsertId();
} catch (PDOException $e) {
  json_error('Error guardando el consumo', 500);
}

$fmtArs = function (float $v): string {
  return '$ ' . number_format($v, 0, ',', '.');
};

$personasTxt = $personas === 1 ? '1 persona' : $personas . ' personas';
$fechaLinda = $d->format('d/m/Y');
$totalTxt = $fmtArs($total);

$detalle = $fmtArs($consumo) . ' de consumo';
if ($adicional > 0) {
  $detalle .= ' + ' . $fmtArs($adicional) . ' de adicional de ' . $zona['nombre'];
}
$mensaje = "Hola! Quiero ir a " . $zona['nombre'] . " el $fechaLinda con $personasTxt. "
  . "Saco $detalle, total $totalTxt. Soy $nombre.";

json_out([
  'ok' => true,
  'consumo_id' => $consumo_id,
  'zona' => $zona['nombre'],
  'zona_id' => $zona_id,
  'personas' => $personas,
  'fecha_evento' => $fecha_evento,
  'consumo_base' => $consumo,
  'costo_adicional' => $adicional,
  'total' => $total,
  'instagram' => PUBLIC_INSTAGRAM,
  'instagram_url' => 'https://instagram.com/' . PUBLIC_INSTAGRAM,
  'mensaje' => $mensaje,
]);