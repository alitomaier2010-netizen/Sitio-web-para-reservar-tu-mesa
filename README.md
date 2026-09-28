# Non Stop · Reservá tu mesa

Sitio web para reservar mesas en Non Stop. Mapa interactivo del salón con info por
mesa (sector, capacidad, precio y consumo mínimo según el día) y reserva guardada
en MySQL + mensaje para Instagram.

## Estructura

```
Frontend/               sitio + backend (document root)
  index.html              estructura + badge de estado API + botón ⚙ + link Admin
  admin.html              panel admin (pendiente/confirmada/cancelada)
  style.css               estilos (mapa, panel, form, admin, modo edición)
  script.js               lógica: hotspots, fechas reales, form, POST reserva, modo edición
  data.js                 fallback offline (si MySQL/PHP no responden)
  Mapas-limpio.jpg / Mapas de mesas de frente.jpeg
  api/
    config.php            DB_HOST/NAME/USER/PASS + ADMIN_KEY
    db.php                PDO + fechas (próximo vie/sáb) + helpers JSON
    fechas.php            GET -> { hoy, viernes, sabado }
    mesas.php             GET ?dia&fecha -> 112 mesas con disponible/estado/precio PARA ESA FECHA
    reservar.php          POST { mesa_id, dia, fecha_evento?, cliente_nombre, cliente_contacto }
    admin.php             GET lista / POST cambia estado / POST guarda posiciones del mapa

base de datos/
  non_stop.sql            esquema v2 + datos (CREATE DATABASE non_stop)

instalar_xampp.bat        copia Frontend a C:\xampp\htdocs\non_stop e importa el SQL
```

## Cómo correrlo (XAMPP)

1. Abrí **XAMPP Control Panel** y encendé **Apache** + **MySQL**.
2. Doble click en `instalar_xampp.bat` (o manual):
   - Copiar `Frontend/*` a `C:\xampp\htdocs\non_stop\`
   - En phpMyAdmin (`http://localhost/phpmyadmin`) importar `base de datos/non_stop.sql`
3. Abrí `http://localhost/non_stop/` y `http://localhost/non_stop/admin.html`.

Alternativa sin Apache (igual necesita MySQL encendido):

```bash
cd "Sitio web de Non Stop/Frontend"
"C:\xampp\php\php.exe" -S 127.0.0.1:8081
```

Abrir `http://127.0.0.1:8081/`. Si servís con `python -m http.server`, el PHP no
corre y el sitio entra en **modo offline** (usa `data.js`, reserva solo por Instagram).

## Cómo funciona ahora

- **Disponibilidad por fecha**: viernes y sábado independientes. Una mesa reservada
  un sábado sigue libre el viernes. Lo define `reservas` (`pendiente`/`confirmada`
  bloquean), con `UNIQUE(mesa_id, fecha_evento)` + transacción `SELECT ... FOR UPDATE`
  anti doble-click. `mesas.estado` queda solo para fuera de servicio.
- **Fechas reales**: `api/fechas.php` calcula el próximo viernes/sábado (si hoy es
  sábado, devuelve hoy). El frontend muestra "Sábado 3 oct" y guarda `fecha_evento`.
- **Reserva**: form nombre + contacto → `POST api/reservar.php` → guarda con foto de
  `precio/consumo_acordado` → copia el mensaje del servidor → abre Instagram.
  Sin backend, hace fallback al flujo viejo (solo Instagram, avisando).
- **Anti desync**: la fuente es MySQL (`api/mesas.php`). `data.js` es solo fallback.
- **Modo edición ⚙**: botón en el header. Elegís una mesa, clickeás el mapa para
  moverla, "Copiar JSON" (para `data.js`) o "Guardar en DB" (pide clave admin y hace
  `UPDATE mesas SET pos_x/pos_y`). Resuelve el comentario de "modo edición" que
  estaba muerto en `data.js`.
- **Admin**: `admin.html` con clave (`ADMIN_KEY` en `api/config.php`).
  Filtra por estado, confirma/cancela. Al cancelar se
  libera la fecha y se puede reutilizar (el PHP hace UPDATE de la fila cancelada).

## Configurar

- `Frontend/api/config.php`: `DB_*` y `ADMIN_KEY` (actual: `Alitopro2010`).
- Precios/capacidades: se editan en MySQL (`precios`, `sectores`); el frontend los
  lee de la API. `data.js` queda como espejo offline (actualizalo si cambiás precios).
