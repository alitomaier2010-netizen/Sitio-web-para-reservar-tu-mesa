<?php
// Configuración Non Stop - XAMPP por defecto
// Cambiá estos valores si tu MySQL tiene otra clave/usuario.

define('DB_HOST', '127.0.0.1');
define('DB_NAME', 'non_stop');
define('DB_USER', 'root');
define('DB_PASS', ''); // XAMPP por defecto: vacío
define('DB_CHARSET', 'utf8mb4');

// Clave simple para el panel admin (admin.html).
// Cambiala por una tuya. Se usa como ?key=... y en POST.
define('ADMIN_KEY', 'Alitopro2010');

// Instagram único (igual que PUBLICA_UNICA en data.js).
// Se mantiene acá para armar el mensaje de reserva en el servidor.
define('PUBLIC_NOMBRE', 'Aramis');
define('PUBLIC_INSTAGRAM', 'ara.nonstop');
