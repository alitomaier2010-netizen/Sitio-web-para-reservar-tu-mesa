<?php
require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');
echo json_encode(['ok' => true] + fechas_semana(), JSON_UNESCAPED_UNICODE);
