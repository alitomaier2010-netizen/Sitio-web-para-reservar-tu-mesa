CREATE DATABASE IF NOT EXISTS non_stop
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE non_stop;

-- Esquema v4: cuentas de usuario (usuarios), control de intentos
-- (auth_intentos) y vínculo opcional de reservas/consumos con la cuenta.

CREATE TABLE sectores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  capacidad INT NOT NULL,
  vendible BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE categorias_precio (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  es_full BOOLEAN NOT NULL DEFAULT FALSE
) ENGINE=InnoDB;

CREATE TABLE precios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  categoria_precio_id INT NOT NULL,
  dia ENUM('viernes','sabado') NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  consumo DECIMAL(10,2) NULL,
  UNIQUE KEY uq_categoria_dia (categoria_precio_id, dia),
  FOREIGN KEY (categoria_precio_id) REFERENCES categorias_precio(id)
) ENGINE=InnoDB;

CREATE TABLE publicos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  instagram VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- CUENTAS DE USUARIO
-- La contraseña NUNCA se guarda en texto plano: password_hash() de PHP
-- (bcrypt/argon2) devuelve un hash de ~60-255 caracteres.
-- La cuenta es OPCIONAL: se puede reservar y sacar consumo sin registrarse.
-- ---------------------------------------------------------------------------
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL,
  nombre_completo VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('cliente','admin') NOT NULL DEFAULT 'cliente',
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ultimo_login DATETIME NULL,
  UNIQUE KEY uq_email (email)
) ENGINE=InnoDB;

-- Intentos de login/registro para frenar fuerza bruta.
-- Solo se guardan la IP y el email intentado, no la contraseña.
CREATE TABLE auth_intentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ip VARCHAR(45) NOT NULL,
  email VARCHAR(190) NOT NULL DEFAULT '',
  accion ENUM('login','registro','reserva','consumo') NOT NULL DEFAULT 'login',
  exito BOOLEAN NOT NULL DEFAULT FALSE,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_ip_fecha (ip, creado_en),
  KEY idx_email_fecha (email, creado_en)
) ENGINE=InnoDB;

CREATE TABLE mesas (
  id VARCHAR(10) PRIMARY KEY,
  sector_id INT NOT NULL,
  categoria_precio_id INT NULL,
  pos_x DECIMAL(5,2) NOT NULL,
  pos_y DECIMAL(5,2) NOT NULL,
  capacidad INT NOT NULL,
  estado ENUM('disponible','reservada') NOT NULL DEFAULT 'disponible',
  publica_id INT NOT NULL,
  FOREIGN KEY (sector_id) REFERENCES sectores(id),
  FOREIGN KEY (categoria_precio_id) REFERENCES categorias_precio(id),
  FOREIGN KEY (publica_id) REFERENCES publicos(id)
) ENGINE=InnoDB;

CREATE TABLE reservas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NULL,
  mesa_id VARCHAR(10) NOT NULL,
  dia ENUM('viernes','sabado') NOT NULL,
  fecha_evento DATE NOT NULL,
  cliente_nombre VARCHAR(100) NOT NULL,
  cliente_contacto VARCHAR(100) NOT NULL,
  precio_acordado DECIMAL(10,2) NOT NULL,
  consumo_acordado DECIMAL(10,2) NULL,
  estado ENUM('pendiente','confirmada','cancelada') NOT NULL DEFAULT 'pendiente',
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mesa_id) REFERENCES mesas(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  UNIQUE KEY uq_mesa_fecha (mesa_id, fecha_evento),
  KEY idx_fecha_estado (fecha_evento, estado),
  KEY idx_usuario (usuario_id)
) ENGINE=InnoDB;

INSERT INTO sectores (id, nombre, capacidad, vendible) VALUES
  (1, 'Escenario', 10, TRUE),
  (2, 'VIP Burbuja', 10, TRUE),
  (3, 'Gradas', 6, FALSE),
  (4, 'Ultra VIP', 8, TRUE),
  (5, 'VIP', 8, TRUE),
  (6, 'Balcón Tincho', 6, TRUE),
  (7, 'Balcón Canepa', 6, TRUE),
  (8, 'VIP Suite', 10, TRUE),
  (9, 'Platea', 4, TRUE);

INSERT INTO categorias_precio (id, nombre, es_full) VALUES
  (1, 'Escenario', TRUE),
  (2, 'Backstage', TRUE),
  (3, 'UltraVIP1', FALSE),
  (4, 'UltraVIP2', FALSE),
  (5, 'Palco', FALSE),
  (6, 'Suite', FALSE),
  (7, 'Platea', FALSE);

INSERT INTO precios (categoria_precio_id, dia, precio, consumo) VALUES
  (1, 'viernes', 1300000.00, NULL),
  (1, 'sabado', 1500000.00, NULL),
  (2, 'viernes', 1000000.00, NULL),
  (2, 'sabado', 1200000.00, NULL),
  (3, 'viernes', 500000.00, 440000.00),
  (3, 'sabado', 600000.00, 540000.00),
  (4, 'viernes', 400000.00, 340000.00),
  (4, 'sabado', 500000.00, 440000.00),
  (5, 'viernes', 300000.00, 240000.00),
  (5, 'sabado', 400000.00, 340000.00),
  (6, 'viernes', 300000.00, 240000.00),
  (6, 'sabado', 400000.00, 340000.00),
  (7, 'viernes', 200000.00, 140000.00),
  (7, 'sabado', 200000.00, 140000.00);

INSERT INTO publicos (id, nombre, instagram) VALUES
  (1, 'Aramis', 'ara.nonstop');

INSERT INTO mesas (id, sector_id, categoria_precio_id, pos_x, pos_y, capacidad, estado, publica_id) VALUES
  ('1', 1, 1, 33.71, 19.96, 10, 'disponible', 1),
  ('2', 1, 1, 39.21, 17.54, 10, 'disponible', 1),
  ('3', 1, 1, 49.40, 16.91, 10, 'disponible', 1),
  ('4', 1, 1, 59.32, 17.54, 10, 'disponible', 1),
  ('5', 1, 1, 65.08, 19.96, 10, 'disponible', 1),
  ('A', 3, NULL, 28.35, 27.70, 6, 'disponible', 1),
  ('B', 3, NULL, 28.35, 30.74, 6, 'disponible', 1),
  ('6', 2, 2, 38.47, 26.56, 10, 'disponible', 1),
  ('7', 2, 2, 48.93, 26.56, 10, 'disponible', 1),
  ('8', 2, 2, 53.62, 26.56, 10, 'disponible', 1),
  ('9', 2, 2, 63.67, 26.56, 10, 'disponible', 1),
  ('10', 2, 2, 68.36, 26.56, 10, 'disponible', 1),
  ('11', 2, 2, 38.47, 30.86, 10, 'disponible', 1),
  ('12', 2, 2, 48.93, 30.86, 10, 'disponible', 1),
  ('13', 2, 2, 53.62, 30.86, 10, 'disponible', 1),
  ('14', 2, 2, 63.67, 30.86, 10, 'disponible', 1),
  ('15', 2, 2, 68.36, 30.86, 10, 'disponible', 1),
  ('C', 3, NULL, 71.51, 27.07, 6, 'disponible', 1),
  ('D', 3, NULL, 71.51, 31.21, 6, 'disponible', 1),
  ('E', 3, NULL, 71.51, 35.51, 6, 'disponible', 1),
  ('F', 3, NULL, 71.51, 39.61, 6, 'disponible', 1),
  ('16', 4, 3, 39.75, 35.51, 8, 'disponible', 1),
  ('17', 4, 3, 44.37, 35.51, 8, 'disponible', 1),
  ('18', 4, 3, 49.06, 35.51, 8, 'disponible', 1),
  ('19', 4, 3, 53.69, 35.51, 8, 'disponible', 1),
  ('20', 4, 3, 58.38, 35.51, 8, 'disponible', 1),
  ('21', 4, 3, 63.07, 35.51, 8, 'disponible', 1),
  ('22', 4, 3, 37.87, 38.75, 8, 'disponible', 1),
  ('23', 4, 3, 42.56, 38.71, 8, 'disponible', 1),
  ('24', 4, 3, 47.25, 38.71, 8, 'disponible', 1),
  ('25', 4, 3, 51.88, 38.75, 8, 'disponible', 1),
  ('26', 4, 3, 56.57, 38.71, 8, 'disponible', 1),
  ('27', 4, 3, 61.19, 38.71, 8, 'disponible', 1),
  ('28', 4, 3, 65.75, 38.71, 8, 'disponible', 1),
  ('29', 4, 4, 37.87, 40.98, 8, 'disponible', 1),
  ('30', 4, 4, 42.56, 40.98, 8, 'disponible', 1),
  ('31', 4, 4, 47.25, 40.98, 8, 'disponible', 1),
  ('32', 4, 4, 51.88, 40.98, 8, 'disponible', 1),
  ('33', 4, 4, 56.57, 40.98, 8, 'disponible', 1),
  ('34', 4, 4, 61.19, 40.98, 8, 'disponible', 1),
  ('35', 4, 4, 65.88, 40.98, 8, 'disponible', 1),
  ('36', 4, 4, 39.75, 43.98, 8, 'disponible', 1),
  ('37', 4, 4, 44.37, 43.98, 8, 'disponible', 1),
  ('38', 4, 4, 48.99, 43.95, 8, 'disponible', 1),
  ('39', 4, 4, 53.69, 43.95, 8, 'disponible', 1),
  ('40', 4, 4, 58.38, 43.98, 8, 'disponible', 1),
  ('41', 4, 4, 63.07, 43.98, 8, 'disponible', 1),
  ('42', 4, 4, 72.39, 43.95, 8, 'disponible', 1),
  ('43', 5, 3, 41.29, 46.84, 8, 'disponible', 1),
  ('44', 5, 3, 51.01, 46.84, 8, 'disponible', 1),
  ('45', 5, 3, 55.43, 46.84, 8, 'disponible', 1),
  ('46', 5, 3, 64.95, 46.84, 8, 'disponible', 1),
  ('47', 5, 3, 41.29, 49.10, 8, 'disponible', 1),
  ('48', 5, 3, 51.01, 49.10, 8, 'disponible', 1),
  ('49', 5, 3, 55.43, 49.10, 8, 'disponible', 1),
  ('50', 5, 3, 64.95, 49.10, 8, 'disponible', 1),
  ('51', 5, 3, 41.29, 51.29, 8, 'disponible', 1),
  ('52', 5, 3, 51.01, 51.29, 8, 'disponible', 1),
  ('53', 5, 3, 55.43, 51.29, 8, 'disponible', 1),
  ('54', 5, 3, 64.95, 51.29, 8, 'disponible', 1),
  ('55', 5, 3, 41.29, 53.55, 8, 'disponible', 1),
  ('56', 5, 3, 51.01, 53.55, 8, 'disponible', 1),
  ('57', 5, 3, 55.43, 53.55, 8, 'disponible', 1),
  ('58', 5, 3, 64.95, 53.55, 8, 'disponible', 1),
  ('59', 5, 3, 41.29, 55.74, 8, 'disponible', 1),
  ('60', 5, 3, 51.01, 55.74, 8, 'disponible', 1),
  ('61', 5, 3, 55.43, 55.74, 8, 'disponible', 1),
  ('62', 5, 3, 64.95, 55.74, 8, 'disponible', 1),
  ('63', 5, 3, 41.29, 58.01, 8, 'disponible', 1),
  ('64', 5, 3, 51.01, 58.01, 8, 'disponible', 1),
  ('65', 5, 3, 55.43, 58.01, 8, 'disponible', 1),
  ('66', 5, 3, 64.95, 58.01, 8, 'disponible', 1),
  ('67', 5, 3, 41.29, 60.20, 8, 'disponible', 1),
  ('68', 5, 3, 51.01, 60.20, 8, 'disponible', 1),
  ('69', 5, 3, 55.43, 60.20, 8, 'disponible', 1),
  ('70', 5, 3, 64.95, 60.20, 8, 'disponible', 1),
  ('71', 6, 5, 27.48, 49.53, 6, 'disponible', 1),
  ('72', 6, 5, 27.48, 51.84, 6, 'disponible', 1),
  ('73', 6, 5, 27.48, 54.14, 6, 'disponible', 1),
  ('74', 6, 5, 27.48, 56.48, 6, 'disponible', 1),
  ('75', 6, 5, 27.48, 58.83, 6, 'disponible', 1),
  ('76', 6, 5, 27.48, 61.09, 6, 'disponible', 1),
  ('77', 6, 5, 27.48, 63.44, 6, 'disponible', 1),
  ('78', 7, 5, 72.65, 49.61, 6, 'disponible', 1),
  ('79', 7, 5, 72.65, 51.88, 6, 'disponible', 1),
  ('80', 7, 5, 72.65, 54.22, 6, 'disponible', 1),
  ('81', 7, 5, 72.65, 56.52, 6, 'disponible', 1),
  ('82', 7, 5, 72.65, 58.83, 6, 'disponible', 1),
  ('83', 7, 5, 72.65, 61.17, 6, 'disponible', 1),
  ('84', 7, 5, 72.65, 63.44, 6, 'disponible', 1),
  ('85', 8, 6, 40.35, 69.26, 10, 'disponible', 1),
  ('86', 8, 6, 45.17, 69.26, 10, 'disponible', 1),
  ('87', 8, 6, 50.07, 69.26, 10, 'disponible', 1),
  ('88', 8, 6, 55.09, 69.26, 10, 'disponible', 1),
  ('89', 8, 6, 34.92, 71.33, 10, 'disponible', 1),
  ('90', 8, 6, 47.72, 72.11, 10, 'disponible', 1),
  ('91', 8, 6, 60.59, 71.33, 10, 'disponible', 1),
  ('92', 8, 6, 34.85, 74.61, 10, 'disponible', 1),
  ('93', 8, 6, 47.86, 75.39, 10, 'disponible', 1),
  ('94', 8, 6, 60.59, 74.61, 10, 'disponible', 1),
  ('95', 8, 6, 34.99, 77.85, 10, 'disponible', 1),
  ('96', 8, 6, 44.64, 78.83, 10, 'disponible', 1),
  ('97', 8, 6, 50.94, 78.83, 10, 'disponible', 1),
  ('98', 8, 6, 60.72, 77.89, 10, 'disponible', 1),
  ('C1', 9, 7, 32.98, 85.39, 4, 'disponible', 1),
  ('C2', 9, 7, 37.94, 85.51, 4, 'disponible', 1),
  ('C3', 9, 7, 42.90, 85.47, 4, 'disponible', 1),
  ('C4', 9, 7, 47.86, 85.51, 4, 'disponible', 1),
  ('C5', 9, 7, 52.68, 85.51, 4, 'disponible', 1),
  ('C6', 9, 7, 57.64, 85.47, 4, 'disponible', 1),
  ('C7', 9, 7, 62.60, 85.51, 4, 'disponible', 1),
  ('C8', 9, 7, 67.56, 85.51, 4, 'disponible', 1);

-- ---------------------------------------------------------------------------
-- SECCION "SALIR - CONSUMO"
-- A diferencia de "Reservar mesa", acá se elige una ZONA (no una mesa).
-- No hay pago online: se registra el pedido y se coordina por contacto.
-- ---------------------------------------------------------------------------

-- Zonas habilitadas para sacar consumo + costo adicional por zona.
-- El costo adicional es un TOTAL de la zona (no se multiplica por personas).
CREATE TABLE zonas_consumo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sector_id INT NOT NULL UNIQUE,
  nombre VARCHAR(60) NOT NULL,
  consumo_adicional DECIMAL(10,2) NOT NULL DEFAULT 0,
  descripcion VARCHAR(180) NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (sector_id) REFERENCES sectores(id)
) ENGINE=InnoDB;

-- Consumos sacados. Máximo 6 personas por consumo (regla del boliche).
CREATE TABLE consumos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NULL,
  zona_id INT NOT NULL,
  fecha_evento DATE NOT NULL,
  persona_nombre VARCHAR(100) NOT NULL,
  persona_contacto VARCHAR(100) NOT NULL,
  personas TINYINT UNSIGNED NOT NULL DEFAULT 1,
  consumo_base DECIMAL(10,2) NOT NULL,
  costo_adicional DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  estado ENUM('pendiente','confirmado','cancelado') NOT NULL DEFAULT 'pendiente',
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (zona_id) REFERENCES zonas_consumo(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  KEY idx_fecha_estado (fecha_evento, estado),
  KEY idx_usuario (usuario_id)
) ENGINE=InnoDB;

INSERT INTO zonas_consumo (sector_id, nombre, consumo_adicional, descripcion, activo) VALUES
  (1, 'Escenario',    40000.00, 'Zona alta frente al escenario. Adicional total de la zona.', TRUE),
  (2, 'Backstage',    30000.00, 'Zona tipo burbuja detrás del DJ. Adicional total de la zona.', TRUE),
  (3, 'Gradas',           0.00, 'Gradas. Sin adicional.', FALSE),
  (4, 'Ultra VIP',        0.00, 'Mesas 16 a 42. Sin adicional.', TRUE),
  (5, 'VIP',              0.00, 'Zona del medio, mesas 43 a 70. Sin adicional.', TRUE),
  (6, 'Palco Tincho', 20000.00, 'Balcón Tincho. Adicional total de la zona.', TRUE),
  (7, 'Palco Canepa', 20000.00, 'Balcón Canepa. Adicional total de la zona.', TRUE),
  (8, 'VIP Suite',        0.00, 'Mesas 85 a 98. Sin adicional.', TRUE),
  (9, 'Platea',           0.00, 'Mesas C1 a C8. Sin adicional.', TRUE);

INSERT INTO consumos (zona_id, fecha_evento, persona_nombre, persona_contacto, personas, consumo_base, costo_adicional, total, estado) VALUES
  (6, '2026-10-09', 'Ejemplo Palco Tincho', '1155555555', 3, 80000.00, 20000.00, 100000.00, 'pendiente');

-- ---------------------------------------------------------------------------
-- SECCION "PRECIOS BARRA" (carta)
-- ---------------------------------------------------------------------------

CREATE TABLE formas_pago (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(60) NOT NULL,
  detalle VARCHAR(180) NULL,
  orden TINYINT NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

INSERT INTO formas_pago (nombre, detalle, orden, activo) VALUES
  ('Efectivo',           'Efectivo en pesos, en la barra y en el box.', 1, TRUE),
  ('Transferencia',      'Transferencia bancaria. Se coordina por contacto.', 2, TRUE),
  ('Mercado Pago',       'Mercado Pago con tarjeta o dinero en cuenta.', 3, TRUE);

CREATE TABLE carta_categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL,
  nota VARCHAR(120) NULL,
  columna ENUM('izq','der') NOT NULL DEFAULT 'izq',
  orden TINYINT NOT NULL DEFAULT 0,
  es_caja BOOLEAN NOT NULL DEFAULT FALSE
) ENGINE=InnoDB;

CREATE TABLE carta_productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  categoria_id INT NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  precio_lista DECIMAL(10,2) NULL,
  precio_efectivo DECIMAL(10,2) NULL,
  orden TINYINT NOT NULL DEFAULT 0,
  FOREIGN KEY (categoria_id) REFERENCES carta_categorias(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Promo del día. Se muestra arriba de la carta si está vigente.
CREATE TABLE promos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(120) NOT NULL,
  detalle VARCHAR(180) NULL,
  precio_lista DECIMAL(10,2) NULL,
  precio_efectivo DECIMAL(10,2) NULL,
  vigente_desde DATE NULL,
  vigente_hasta DATE NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

INSERT INTO carta_categorias (id, nombre, nota, columna, orden, es_caja) VALUES
  (1,'TRAGOS',               NULL,                                          'izq', 1, FALSE),
  (2,'VINO',                 NULL,                                          'izq', 2, FALSE),
  (3,'CERVEZAS',             NULL,                                          'izq', 3, FALSE),
  (4,'BEBIDAS SIN ALCOHOL',  NULL,                                          'izq', 4, FALSE),
  (5,'SHOTS Y MEDIDAS',      NULL,                                          'izq', 5, FALSE),
  (6,'SPEED',                NULL,                                          'izq', 6, FALSE),
  (7,'VASOS Y COPAS',        NULL,                                          'izq', 7, TRUE),
  (8,'VODKA IMPORTADO',      'INCLUYE 4 SPEED + 2 VASOS',                   'der', 1, FALSE),
  (9,'CHAMPAGNE IMPORTADO',  'INCLUYE 2 VASOS',                             'der', 2, FALSE),
  (10,'CHAMPAGNE',           NULL,                                          'der', 3, FALSE),
  (11,'WHISKIES',            'INCLUYE 2 SPEED O BOTELLA',                   'der', 4, FALSE),
  (12,'DESTILADOS Y LICORES','INCLUYE 2 SPEED O BOTELLA GASEOSA',           'der', 5, FALSE),
  (13,'APERITIVOS',          'INCLUYE BOTELLA GASEOSA O JUGO',              'der', 6, FALSE);

INSERT INTO carta_productos (categoria_id, nombre, precio_lista, precio_efectivo, orden) VALUES
  (1,'Brancacola',              15400.00, 14000.00, 1),
  (1,'Gordon''s Tonic',         15400.00, 14000.00, 2),
  (1,'Smirnoff con Jugo',       15400.00, 14000.00, 3),
  (1,'Sex on the Beach',        15400.00, 14000.00, 4),
  (1,'Campari c/Naranja',       15400.00, 14000.00, 5),
  (1,'Whiscola',                15400.00, 14000.00, 6),
  (1,'Moserboom',               15400.00, 14000.00, 7),
  (1,'Caipirinha',              15400.00, 14000.00, 8),
  (1,'Caipiroska',              15400.00, 14000.00, 9),
  (1,'Cuba Libre',              15400.00, 14000.00, 10),
  (2,'Tinto - Blanco - Rosado', 44000.00, 40000.00, 1),
  (2,'Trumpeter Malbec',        55000.00, 50000.00, 2),
  (3,'Corona 330CC',            16500.00, 15000.00, 1),
  (3,'Budweiser 473CC',         14300.00, 13000.00, 2),
  (3,'Cerveza Artesanal Lata',  14300.00, 13000.00, 3),
  (4,'Limonada',                 8800.00,  8000.00, 1),
  (4,'Agua',                     8800.00,  8000.00, 2),
  (4,'Vaso Gaseosa/Jugo',        7700.00,  7000.00, 3),
  (4,'Cepita 1L',               16500.00, 15000.00, 4),
  (4,'Botella de Gaseosa',      18700.00, 17000.00, 5),
  (5,'Jack Daniel''s Black',     17600.00, 16000.00, 1),
  (5,'Johnnie Walker Black',     19800.00, 18000.00, 2),
  (5,'Johnnie Walker Red',       17600.00, 16000.00, 3),
  (5,'J&B',                      14300.00, 13000.00, 4),
  (5,'Malibu',                   14300.00, 13000.00, 5),
  (5,'Hólmoser',               14300.00, 13000.00, 6),
  (5,'Absolut',                  14300.00, 13000.00, 7),
  (5,'Absolut Saborizado',       16500.00, 15000.00, 8),
  (6,'Lata 269ML',                8800.00,  8000.00, 1),
  (7,'Vaso Trago Largo',          6000.00,  6000.00, 1),
  (7,'Copón s/tallo',            7700.00,  7000.00, 2),
  (7,'Copón',                    9900.00,  9000.00, 3),
  (7,'Copa Champagne',            8800.00,  8000.00, 4),
  (7,'Vaso Whisky',               7700.00,  7000.00, 5),
  (8,'Nuvo',                     418000.00, 380000.00, 1),
  (8,'Belvedere Night Saber',    385000.00, 350000.00, 2),
  (8,'Grey Goose Reg y Sab Luminoso', 423500.00, 385000.00, 3),
  (8,'Ciroc Saborizado Luminoso',330000.00, 300000.00, 4),
  (8,'Pravda Reg y Sab',         330000.00, 300000.00, 5),
  (8,'Absolut Reg y Sab',        181500.00, 165000.00, 6),
  (9,'Dom Perignon Blanc Vintage',1694000.00,1540000.00, 1),
  (9,'Dom Perignon Luminoso Lebel',1936000.00,1760000.00,2),
  (9,'Veuve Clicquot Brut Yellow', 583000.00, 530000.00, 3),
  (9,'Veuve Clicquot Rich',       726000.00, 660000.00, 4),
  (9,'Pommery Sur Glace',         786500.00, 715000.00, 5),
  (9,'Moet & Chandon Brut Imperial',583000.00,530000.00,6),
  (9,'Moet & Chandon Ice Imperial',726000.00,660000.00,7),
  (9,'Moet Nectar Imperial Rose', 1452000.00,1320000.00, 8),
  (9,'Aviva Glitter Luminoso 750CC',198000.00,180000.00, 9),
  (10,'Baron B Rose 750CC',       143000.00, 130000.00, 1),
  (10,'Baron B Extra Brut 750CC', 132000.00, 120000.00, 2),
  (10,'Chandon 750CC',            104500.00,  95000.00, 3),
  (10,'Chandon Magnum 1,5L',      198000.00, 180000.00, 4),
  (10,'Navarro Correa 750CC',     77000.00,  70000.00, 5),
  (11,'J&B 750',                  143000.00, 130000.00, 1),
  (11,'Jack Daniel''s 700',       220000.00, 200000.00, 2),
  (11,'Jack Daniel''s Honey 700', 220000.00, 200000.00, 3),
  (11,'Johnnie Red 750',          198000.00, 180000.00, 4),
  (11,'Johnnie Black 750',        242000.00, 220000.00, 5),
  (11,'Johnnie Blue Label 750',  1694000.00,1540000.00, 6),
  (12,'Hólmoser',               121000.00, 110000.00, 1),
  (12,'Gordon''s Regular',        88000.00,  80000.00, 2),
  (12,'Gordon''s Pink',           88000.00,  80000.00, 3),
  (12,'Gordon''s Tropical',       88000.00,  80000.00, 4),
  (12,'Havana Club',              104500.00,  95000.00, 5),
  (12,'Malibu',                   121000.00, 110000.00, 6),
  (12,'Jägermeister',           198000.00, 180000.00, 7),
  (13,'Gancia',                    77000.00,  70000.00, 1),
  (13,'Aperol',                    88000.00,  80000.00, 2),
  (13,'Campari',                   82500.00,  75000.00, 3),
  (13,'Fernet Branca',            110000.00, 100000.00, 4);

INSERT INTO promos (titulo, detalle, precio_lista, precio_efectivo, vigente_desde, vigente_hasta, activo) VALUES
  ('SMIRNOFF + 3 SPEED UNLIMITED',
   'Smirnoff saborizado. Regular P.L. 93.500 / Desc. Efect. 85.000. Saborizado P.L. 99.000 / Desc. Efect. 90.000.',
   93500.00, 85000.00, NULL, NULL, TRUE);
