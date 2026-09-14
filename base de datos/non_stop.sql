-- Base de datos del sitio Non Stop (mapa de mesas y reservas)
-- Dialecto: MySQL / MariaDB (usa ENGINE=InnoDB por las FOREIGN KEY)
-- Generado a partir de Frontend/data.js

CREATE TABLE sectores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  capacidad INT NOT NULL,
  vendible BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE categorias_precio (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE, -- Escenario, Backstage, UltraVIP1 (mesas 16-28 y bloque VIP central), UltraVIP2, Palco, Suite, Platea
  es_full BOOLEAN NOT NULL DEFAULT FALSE -- TRUE = precio unico sin consumo minimo aparte
) ENGINE=InnoDB;

CREATE TABLE precios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  categoria_precio_id INT NOT NULL,
  dia ENUM('viernes','sabado') NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  consumo DECIMAL(10,2) NULL, -- NULL cuando la categoria es full
  UNIQUE KEY uq_categoria_dia (categoria_precio_id, dia),
  FOREIGN KEY (categoria_precio_id) REFERENCES categorias_precio(id)
) ENGINE=InnoDB;

CREATE TABLE publicos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  instagram VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE mesas (
  id VARCHAR(10) PRIMARY KEY, -- coincide con el id del mapa (ej. '1', 'A', 'C1')
  sector_id INT NOT NULL,
  categoria_precio_id INT NULL, -- NULL = sector no vendible (ej. Gradas)
  pos_x DECIMAL(5,2) NOT NULL, -- posicion % sobre la imagen del mapa
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
  mesa_id VARCHAR(10) NOT NULL,
  dia ENUM('viernes','sabado') NOT NULL,
  fecha_evento DATE NOT NULL,
  cliente_nombre VARCHAR(100) NOT NULL,
  cliente_contacto VARCHAR(100) NOT NULL,
  precio_acordado DECIMAL(10,2) NOT NULL,
  consumo_acordado DECIMAL(10,2) NULL,
  estado ENUM('pendiente','confirmada','cancelada') NOT NULL DEFAULT 'pendiente',
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mesa_id) REFERENCES mesas(id)
) ENGINE=InnoDB;

-- Sectores
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

-- Categorias de precio
INSERT INTO categorias_precio (id, nombre, es_full) VALUES
  (1, 'Escenario', TRUE),
  (2, 'Backstage', TRUE),
  (3, 'UltraVIP1', FALSE),
  (4, 'UltraVIP2', FALSE),
  (5, 'Palco', FALSE),
  (6, 'Suite', FALSE),
  (7, 'Platea', FALSE);

-- Precios por dia
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

-- Publico (promotor/a a cargo)
INSERT INTO publicos (id, nombre, instagram) VALUES
  (1, 'Aramis', 'ara.nonstop');

-- Mesas
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
