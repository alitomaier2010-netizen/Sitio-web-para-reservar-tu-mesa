<?php
// POST api/reservar.php
// Body JSON: { mesa_id, dia, fecha_evento?, cliente_nombre, cliente_contacto }
// Guarda la reserva y devuelve el mensaje para Instagram.
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  json_error('Usá POST', 405);
}

$pdo = db();
$b = body_json();

$mesa_id = trim((string)($b['mesa_id'] ?? ''));
$dia = trim((string)($b['dia'] ?? ''));
$fecha_in = trim((string)($b['fecha_evento'] ?? ''));
$nombre = trim((string)($b['cliente_nombre'] ?? ''));
$contacto = trim((string)($b['cliente_contacto'] ?? ''));

if ($mesa_id === '' || !dia_valido($dia)) {
  json_error('Faltan mesa_id y dia (viernes/sabado)');
}
if (mb_strlen($nombre) < 2 || mb_strlen($nombre) > 100) {
  json_error('Decinos tu nombre (2 a 100 caracteres)');
}
if (mb_strlen($contacto) < 3 || mb_strlen($contacto) > 100) {
  json_error('Dejanos un contacto (celular o Instagram)');
}

$fecha_evento = resolver_fecha($dia, $fecha_in === '' ? null : $fecha_in);

try {
  $pdo->beginTransaction();

  // Bloqueamos la mesa para chequear sin carreras (doble click / 2 clientes a la vez)
  $st = $pdo->prepare("
    SELECT m.id, s.nombre AS sector, m.capacidad, cp.nombre AS categoriaPrecio,
           m.estado AS estado_base
    FROM mesas m
    JOIN sectores s ON s.id = m.sector_id
    LEFT JOIN categorias_precio cp ON cp.id = m.categoria_precio_id
    WHERE m.id = ? FOR UPDATE
  ");
  $st->execute([$mesa_id]);
  $mesa = $st->fetch();
  if (!$mesa) {
    $pdo->rollBack();
    json_error('Esa mesa no existe', 404);
  }
  if ($mesa['categoriaPrecio'] === null) {
    $pdo->rollBack();
    json_error('Ese sector no está disponible para reservar', 409);
  }
  if ($mesa['estado_base'] === 'reservada') {
    $pdo->rollBack();
    json_error('Esa mesa ya está reservada', 409);
  }

  // ¿Ya hay reserva activa para esa fecha?
  $st = $pdo->prepare("
    SELECT id, estado FROM reservas
    WHERE mesa_id = ? AND fecha_evento = ? FOR UPDATE
  ");
  $st->execute([$mesa_id, $fecha_evento]);
  $exist = $st->fetch();

  if ($exist && in_array($exist['estado'], ['pendiente', 'confirmada'], true)) {
    $pdo->rollBack();
    json_error('Esa mesa ya se reservó para esa fecha. Elegí otra.', 409);
  }

  // Precio acordado (foto del precio al momento de reservar)
  $st = $pdo->prepare("
    SELECT pr.precio, pr.consumo
    FROM mesas m
    JOIN categorias_precio cp ON cp.id = m.categoria_precio_id
    JOIN precios pr ON pr.categoria_precio_id = cp.id AND pr.dia = ?
    WHERE m.id = ?
  ");
  $st->execute([$dia, $mesa_id]);
  $pr = $st->fetch();
  if (!$pr) {
    $pdo->rollBack();
    json_error('Sin precio para ese día', 500);
  }

  if ($exist && $exist['estado'] === 'cancelada') {
    // Reutilizamos la fila cancelada (respeta UNIQUE mesa+fecha)
    $st = $pdo->prepare("
      UPDATE reservas
      SET dia = ?, cliente_nombre = ?, cliente_contacto = ?,
          precio_acordado = ?, consumo_acordado = ?, estado = 'pendiente',
          creado_en = NOW()
      WHERE id = ?
    ");
    $st->execute([$dia, $nombre, $contacto, $pr['precio'], $pr['consumo'], $exist['id']]);
    $reserva_id = (int)$exist['id'];
  } else {
    $st = $pdo->prepare("
      INSERT INTO reservas
        (mesa_id, dia, fecha_evento, cliente_nombre, cliente_contacto,
         precio_acordado, consumo_acordado, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente')
    ");
    $st->execute([$mesa_id, $dia, $fecha_evento, $nombre, $contacto, $pr['precio'], $pr['consumo']]);
    $reserva_id = (int)$pdo->lastInsertId();
  }

  $pdo->commit();
} catch (PDOException $e) {
  if ($pdo->inTransaction()) $pdo->rollBack();
  // 23000 = violación de UNIQUE (carrera exacta) -> mensaje amable
  if (($e->errorInfo[0] ?? '') === '23000') {
    json_error('Esa mesa se acaba de reservar. Elegí otra.', 409);
  }
  json_error('Error guardando la reserva', 500);
}

$fmtArs = function (float $v): string {
  return '$ ' . number_format($v, 0, ',', '.');
};
$precioFmt = $fmtArs((float)$pr['precio']);
if ($pr['consumo'] === null) {
  $detalle = "$precioFmt full";
} else {
  $consumoFmt = $fmtArs((float)$pr['consumo']);
  $detalle = "$precioFmt de mesa con $consumoFmt de consumo";
}
$diaLabel = $dia === 'viernes' ? 'viernes' : 'sábado';
$fechaLinda = DateTime::createFromFormat('Y-m-d', $fecha_evento)->format('d/m/Y');
$mensaje = "Hola! Quiero reservar la mesa $mesa_id ({$mesa['sector']}) para el $diaLabel $fechaLinda. Vi que sale $detalle. Soy $nombre.";

json_out([
  'ok' => true,
  'reserva_id' => $reserva_id,
  'mesa_id' => $mesa_id,
  'dia' => $dia,
  'fecha_evento' => $fecha_evento,
  'instagram' => PUBLIC_INSTAGRAM,
  'instagram_url' => 'https://instagram.com/' . PUBLIC_INSTAGRAM,
  'mensaje' => $mensaje,
]);
