# Non Stop · Reservá tu mesa

Sitio web para reservar mesas en Non Stop. Mapa interactivo del salón con info por
mesa (sector, capacidad, precio y consumo mínimo según el día) y reserva guardada
en MySQL + mensaje para Instagram.

**Entrada: `portada.html`** con tres botones: reservar mesa, precios de barra
(carta) y "Salir - Consumo" (elegir zona y sacar consumo).

## Estructura

```
Frontend/               sitio + backend (document root)
  portada.html           portada con los 3 botones
  portada.js              chequeo de estado del API
  carta.html              carta de barra (formato de 2 columnas)
  carta.js                render de la carta desde la API
  consumo.html            "Salir - Consumo": zona + personas + monto
  consumo.js              render, resumen en vivo y POST
  index.html              estructura + badge de estado API + botón ⚙ + link Admin
  admin.html              panel admin (pendiente/confirmada/cancelada)
  style.css               estilos (mapa, panel, form, admin, portada, carta)
  script.js               lógica: hotspots, fechas reales, form, POST reserva, modo edición
  data.js                 fallback offline (si MySQL/PHP no responden)
  carta.jpeg             carta original (referencia; la web usa MySQL)
  Mapas-limpio.jpg / Mapas de mesas de frente.jpeg
  Nuevo boceto y pantalla de carga/   bocetos a mano (referencia de diseño)
  api/
    config.php            DB_HOST/NAME/USER/PASS + ADMIN_KEY
    db.php                PDO + fechas (próximo vie/sáb) + helpers JSON
    fechas.php            GET -> { hoy, viernes, sabado }
    mesas.php             GET ?dia&fecha -> 112 mesas con disponible/estado/precio PARA ESA FECHA
    reservar.php          POST { mesa_id, dia | fecha_evento, cliente_nombre, cliente_contacto }
    admin.php             GET lista / POST cambia estado / POST guarda posiciones del mapa
    carta.php             GET -> categorías + productos + promo vigente + formas de pago
    consumo.php           GET zonas / POST registra el consumo

base de datos/
  non_stop.sql            esquema v3 + datos (CREATE DATABASE non_stop)

instalar_xampp.bat        copia Frontend a C:\xampp\htdocs\non_stop e importa el SQL
```

## Cómo correrlo (XAMPP)

1. Abrí **XAMPP Control Panel** y encendé **Apache** + **MySQL**.
2. Doble click en `instalar_xampp.bat` (o manual):
   - Copiar `Frontend/*` a `C:\xampp\htdocs\non_stop\`
   - En phpMyAdmin (`http://localhost/phpmyadmin`) importar `base de datos/non_stop.sql`
3. Abrí `http://localhost/non_stop/portada.html` (portada),
   `.../index.html` (mapa) y `.../admin.html` (admin).

Ojo: `non_stop.sql` usa `CREATE TABLE` sin `IF NOT EXISTS`. Importarlo sobre una base
ya cargada tira `ERROR 1050 Table already exists` pero **no borra nada**; si querés
empezar de cero, primero `DROP DATABASE non_stop;` en phpMyAdmin.

Alternativa sin Apache (igual necesita MySQL encendido):

```bash
cd "Sitio web de Non Stop/Frontend"
"C:\xampp\php\php.exe" -S 127.0.0.1:8081
```

Abrir `http://127.0.0.1:8081/`. Si servís con `python -m http.server`, el PHP no
corre y el sitio entra en **modo offline** (usa `data.js`, reserva solo por Instagram).

## Las tres secciones

**1. Reservar mesa** (`index.html`) — el mapa de siempre.

- **Disponibilidad por fecha**: viernes y sábado independientes. Una mesa reservada
  un sábado sigue libre el viernes. Lo define `reservas` (`pendiente`/`confirmada`
  bloquean), con `UNIQUE(mesa_id, fecha_evento)` + transacción `SELECT ... FOR UPDATE`
  anti doble-click. `mesas.estado` queda solo para fuera de servicio.
- **Fechas reales**: `api/fechas.php` calcula el próximo viernes/sábado (si hoy es
  sábado, devuelve hoy). El frontend muestra "Sábado 3 oct" y guarda `fecha_evento`.
- **Reserva**: form nombre + contacto → `POST api/reservar.php` → guarda con foto de
  `precio/consumo_acordado` → copia el mensaje del servidor → abre Instagram.
  Acepta mandar `dia` **o** solo `fecha_evento` (lo deriva del día de la semana).
  Sin backend, hace fallback al flujo viejo (solo Instagram, avisando).
- **Anti desync**: la fuente es MySQL (`api/mesas.php`). `data.js` es solo fallback.
- **Modo edición ⚙**: botón en el header. Elegís una mesa, clickeás el mapa para
  moverla, "Copiar JSON" (para `data.js`) o "Guardar en DB" (pide clave admin y hace
  `UPDATE mesas SET pos_x/pos_y`).
- **Admin**: `admin.html` con clave (`ADMIN_KEY` en `api/config.php`).
  Filtra por estado, confirma/cancela. Al cancelar se libera la fecha.

**2. Precios barra** (`carta.html`) — la carta con el formato del boceto: dos
columnas, cada producto con **P.L** (precio lista, tachado) y **Desc. Efect.**
(efectivo). La promo vigente se destaca arriba y las formas de pago abajo.
Todo sale de MySQL: `carta_categorias` (con `columna` izq/der y `nota` del tipo
"INCLUYE 2 VASOS"), `carta_productos` y `promos`.

**3. Salir - Consumo** (`consumo.html`) — **no es una reserva de mesa**: elegís una
**zona** y sacás un consumo para pasar la noche.

- Elegís zona (las de `zonas_consumo` con `activo = TRUE`), cuántas personas van
  (máximo 6) y el monto del consumo (sin mínimo, lo elige la persona).
- El **adicional de zona se cobra una sola vez**, no por persona:
  Escenario 40.000 · Backstage 30.000 · Palco Tincho y Palco Canepa 20.000 ·
  VIP, Ultra VIP, Platea y VIP Suite sin adicional. Gradas está desactivada.
- El adicional **se calcula siempre en el servidor** leyendo la tabla; el cliente no
  puede mandarlo. `total = consumo + adicional`.
- No hay pago online: guarda en `consumos`, copia el mensaje y abre Instagram para
  coordinar y pagar el precinto presencialmente.

## Configurar

- `Frontend/api/config.php`: `DB_*` y `ADMIN_KEY` (actual: `Alitopro2010`).
- Precios/capacidades: se editan en MySQL (`precios`, `sectores`); el frontend los
  lee de la API. `data.js` queda como espejo offline (actualizalo si cambiás precios).
- Carta: `carta_categorias`, `carta_productos`, `promos`, `formas_pago`.
- Consumo: `zonas_consumo` (nombre + `consumo_adicional` + `activo`) y `consumos`.
  Para cambiar el adicional: `UPDATE zonas_consumo SET consumo_adicional = ...`.
- Para abrir/cerrar una zona: `UPDATE zonas_consumo SET activo = TRUE/FALSE`.
