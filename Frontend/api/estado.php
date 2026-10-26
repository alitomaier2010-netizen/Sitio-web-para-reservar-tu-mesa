<?php
// GET api/estado.php
// Chequeo liviano para el badge XAMPP: confirma que PHP y MySQL responden.
require_once __DIR__ . '/db.php';

$pdo = db();
$pdo->query('SELECT 1');

json_out([
  'ok' => true,
  'db' => true,
  'hora' => date('c'),
]);
