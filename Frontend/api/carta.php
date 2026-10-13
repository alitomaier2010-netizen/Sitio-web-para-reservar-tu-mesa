<?php
// GET api/carta.php
// Devuelve la carta de barra: categorias + productos + promo vigente + formas de pago.
// Los precios vienen de MySQL (carta_productos.precio_lista / precio_efectivo).
require_once __DIR__ . '/db.php';

$pdo = db();

$categorias = $pdo->query("
  SELECT id, nombre, nota, columna, orden, es_caja
  FROM carta_categorias
  ORDER BY columna ASC, orden ASC
")->fetchAll();

$productos = $pdo->query("
  SELECT categoria_id, nombre, precio_lista, precio_efectivo
  FROM carta_productos
  ORDER BY categoria_id ASC, orden ASC
")->fetchAll();

// Agrupamos productos por categoría en una sola pasada.
$porCategoria = [];
foreach ($productos as $p) {
  $porCategoryId = (int)$p['categoria_id'];
  $porCategoria[$porCategoryId][] = [
    'nombre' => $p['nombre'],
    'precio_lista' => $p['precio_lista'] === null ? null : (float)$p['precio_lista'],
    'precio_efectivo' => $p['precio_efectivo'] === null ? null : (float)$p['precio_efectivo'],
  ];
}

foreach ($categorias as &$c) {
  $c['es_caja'] = (bool)$c['es_caja'];
  $c['productos'] = $porCategoria[(int)$c['id']] ?? [];
}
unset($c);

// Promo del día: solo las vigentes a hoy.
$hoy = date('Y-m-d');
$promos = $pdo->prepare("
  SELECT titulo, detalle, precio_lista, precio_efectivo
  FROM promos
  WHERE activo = TRUE
    AND (vigente_desde IS NULL OR vigente_desde <= ?)
    AND (vigente_hasta IS NULL OR vigente_hasta >= ?)
  ORDER BY id ASC
");
$promos->execute([$hoy, $hoy]);
$promoRows = [];
foreach ($promos->fetchAll() as $r) {
  $promoRows[] = [
    'titulo' => $r['titulo'],
    'detalle' => $r['detalle'],
    'precio_lista' => $r['precio_lista'] === null ? null : (float)$r['precio_lista'],
    'precio_efectivo' => $r['precio_efectivo'] === null ? null : (float)$r['precio_efectivo'],
  ];
}

$formasPago = $pdo->query("
  SELECT nombre, detalle FROM formas_pago WHERE activo = TRUE ORDER BY orden ASC
")->fetchAll();

json_out([
  'ok' => true,
  'categorias' => $categorias,
  'promos' => $promoRows,
  'formas_pago' => $formasPago,
]);