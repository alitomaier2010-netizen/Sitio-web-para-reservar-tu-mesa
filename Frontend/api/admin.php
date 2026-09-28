<?php
// Panel admin simple con clave.
// GET  api/admin.php?key=XXX[&estado=pendiente|confirmada|cancelada|todas]
// POST api/admin.php  { key, id, estado } -> cambia pendiente/confirmada/cancelada
// POST api/admin.php  { key, action:"posiciones", posiciones:{id:[x,y]} } -> guarda mapa
require_once __DIR__ . '/db.php';

$pdo = db();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  check_admin($_GET['key'] ?? null);
  $estado = $_GET['estado'] ?? 'todas';
  $where = '';
  $params = [];
  if (in_array($estado, ['pendiente', 'confirmada', 'cancelada'], true)) {
    $where = 'WHERE r.estado = ?';
    $params[] = $estado;
  }
  $st = $pdo->prepare("
    SELECT r.id, r.mesa_id, s.nombre AS sector, r.dia, r.fecha_evento,
           r.cliente_nombre, r.cliente_contacto,
           r.precio_acordado, r.consumo_acordado, r.estado, r.creado_en
    FROM reservas r
    JOIN mesas m ON m.id = r.mesa_id
    JOIN sectores s ON s.id = m.sector_id
    $where
    ORDER BY r.fecha_evento ASC, r.creado_en DESC
    LIMIT 500
  ");
  $st->execute($params);
  $rows = $st->fetchAll();
  foreach ($rows as &$r) {
    $r['precio_acordado'] = (float)$r['precio_acordado'];
    $r['consumo_acordado'] = $r['consumo_acordado'] === null ? null : (float)$r['consumo_acordado'];
  }
  json_out(['ok' => true, 'reservas' => $rows, 'fechas' => fechas_semana()]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $b = body_json();
  check_admin($b['key'] ?? null);

  // Guardar posiciones del mapa (modo edición ⚙)
  if (($b['action'] ?? '') === 'posiciones') {
    $pos = $b['posiciones'] ?? null;
    if (!is_array($pos) || count($pos) === 0 || count($pos) > 500) {
      json_error('posiciones inválidas');
    }
    $st = $pdo->prepare('UPDATE mesas SET pos_x = ?, pos_y = ? WHERE id = ?');
    $n = 0;
    foreach ($pos as $id => $xy) {
      if (!is_array($xy) || count($xy) !== 2) continue;
      $x = (float)$xy[0]; $y = (float)$xy[1];
      if ($x < 0 || $x > 100 || $y < 0 || $y > 100) continue;
      $st->execute([$x, $y, (string)$id]);
      $n += $st->rowCount();
    }
    json_out(['ok' => true, 'actualizadas' => $n]);
  }

  $id = (int)($b['id'] ?? 0);
  $estado = $b['estado'] ?? '';
  if ($id <= 0 || !in_array($estado, ['pendiente', 'confirmada', 'cancelada'], true)) {
    json_error('Faltan id y estado válido');
  }
  $st = $pdo->prepare('UPDATE reservas SET estado = ? WHERE id = ?');
  $st->execute([$estado, $id]);
  if ($st->rowCount() === 0) json_error('Reserva no encontrada', 404);
  json_out(['ok' => true, 'id' => $id, 'estado' => $estado]);
}

json_error('Método no soportado', 405);
