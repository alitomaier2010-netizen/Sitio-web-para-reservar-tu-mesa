<?php
// GET api/mesas.php?dia=viernes|sabado&fecha=YYYY-MM-DD
// Devuelve mesas con disponibilidad PARA ESA FECHA + precio.
// Sin ?dia devuelve mesas con estado base (para el primer render).
require_once __DIR__ . '/db.php';

$pdo = db();
$dia = $_GET['dia'] ?? null;
$fecha = $_GET['fecha'] ?? null;

if ($dia !== null && !dia_valido($dia)) {
  json_error('dia inválido, usá viernes o sabado');
}

$fecha_evento = null;
if ($dia !== null) {
  $fecha_evento = resolver_fecha($dia, $fecha);
}

// Traemos todo lo necesario en 2 queries (rápido para 112 mesas).
$mesas = $pdo->query("
  SELECT m.id, s.nombre AS sector, m.pos_x AS x, m.pos_y AS y,
         m.capacidad, cp.nombre AS categoriaPrecio, m.estado AS estado_base,
         p.nombre AS publica_nombre, p.instagram AS publica_instagram
  FROM mesas m
  JOIN sectores s ON s.id = m.sector_id
  LEFT JOIN categorias_precio cp ON cp.id = m.categoria_precio_id
  JOIN publicos p ON p.id = m.publica_id
  ORDER BY m.id
")->fetchAll();

// Mapa categoria -> precios por día
$precios = $pdo->query("
  SELECT cp.nombre AS cat, pr.dia, pr.precio, pr.consumo, cp.es_full AS full
  FROM precios pr
  JOIN categorias_precio cp ON cp.id = pr.categoria_precio_id
")->fetchAll();

$map = [];
foreach ($precios as $r) {
  $map[$r['cat']][$r['dia']] = [
    'precio' => (float)$r['precio'],
    'consumo' => $r['consumo'] === null ? null : (float)$r['consumo'],
    'full' => (bool)$r['full'],
  ];
}

// Reservas activas para la fecha pedida (pendiente + confirmada bloquean)
$bloqueadas = [];
if ($fecha_evento !== null) {
  $st = $pdo->prepare("
    SELECT mesa_id FROM reservas
    WHERE fecha_evento = ? AND estado IN ('pendiente','confirmada')
  ");
  $st->execute([$fecha_evento]);
  foreach ($st->fetchAll() as $r) $bloqueadas[$r['mesa_id']] = true;
}

$out = [];
foreach ($mesas as $m) {
  $vendible = $m['categoriaPrecio'] !== null;
  $precioInfo = null;
  if ($vendible && $dia !== null && isset($map[$m['categoriaPrecio']][$dia])) {
    $precioInfo = $map[$m['categoriaPrecio']][$dia];
  }
  $bloqueada = isset($bloqueadas[$m['id']]);
  $baseReservada = $m['estado_base'] === 'reservada';
  $out[] = [
    'id' => $m['id'],
    'sector' => $m['sector'],
    'x' => (float)$m['x'],
    'y' => (float)$m['y'],
    'capacidad' => (int)$m['capacidad'],
    'categoriaPrecio' => $m['categoriaPrecio'],
    'vendible' => $vendible,
    // Disponible PARA LA FECHA (si no se pidió fecha, usa estado base)
    'disponible' => $vendible && !$baseReservada && !$bloqueada,
    'estado' => ($baseReservada || $bloqueada) ? 'reservada' : 'disponible',
    'estado_base' => $m['estado_base'],
    'bloqueada_en_fecha' => $bloqueada,
    'precioInfo' => $precioInfo,
    'publica' => ['nombre' => $m['publica_nombre'], 'instagram' => $m['publica_instagram']],
  ];
}

json_out([
  'ok' => true,
  'dia' => $dia,
  'fecha_evento' => $fecha_evento,
  'fechas' => fechas_semana(),
  'mesas' => $out,
]);
