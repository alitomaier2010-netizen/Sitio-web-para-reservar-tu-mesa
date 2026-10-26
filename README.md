# Non Stop · Reservá tu mesa

Sitio web para reservar mesas en Non Stop. Mapa interactivo del salón con info por
mesa (sector, capacidad, precio y consumo mínimo según el día) y reserva guardada
en MySQL + mensaje para Instagram.

**Entrada: `portada.html`** con tres botones: reservar mesa, precios de barra
(carta) y "Salir - Consumo" (elegir zona y sacar consumo). La portada permite
**entrar con una cuenta o seguir sin registrarse**; la cuenta es siempre opcional.

## Estructura

```
Frontend/               sitio + backend (document root)
  portada.html           portada: acceso opcional + los 3 botones
  portada.js             login / registro / continuar sin cuenta + saludo
  estado.js              badge XAMPP (MySQL conectado / desconectado)
  carta.html              carta de barra (formato de 2 columnas)
  carta.js                render de la carta desde la API
  consumo.html            "Salir - Consumo": zona + personas + monto
  consumo.js              render, resumen en vivo y POST
  index.html              mapa + botón ⚙ + link Admin
  admin.html              panel admin (pendiente/confirmada/cancelada)
  style.css               estilos (mapa, panel, form, admin, portada, carta, badge)
  script.js               lógica: hotspots, fechas reales, form, POST reserva, modo edición
  data.js                 fallback si MySQL/PHP no responden
  .htaccess               sin listado de carpetas + headers de seguridad
  carta.jpeg             carta original (referencia; la web usa MySQL)
  Mapas-limpio.jpg / Mapas de mesas de frente.jpeg
  Nuevo boceto y pantalla de carga/   bocetos a mano (referencia de diseño)
  api/
    config.php            carga config.local.php y define valores por defecto
    config.example.php    plantilla de configuración local
    config.local.php      claves reales (NO se sube a GitHub)
    db.php                PDO + fechas + helpers JSON + auth del admin
    session.php           sesiones, rate limit y helpers de cuenta
    auth/registro.php     POST crea cuenta e inicia sesión
    auth/login.php        POST valida contraseña e inicia sesión
    auth/logout.php       POST cierra sesión
    auth/sesion.php       GET devuelve la cuenta logueada (o null)
    estado.php            GET chequeo liviano para el badge XAMPP
    fechas.php            GET -> { hoy, viernes, sabado }
    mesas.php             GET ?dia&fecha -> 112 mesas con disponible/estado/precio PARA ESA FECHA
    reservar.php          POST { mesa_id, dia | fecha_evento, cliente_nombre, cliente_contacto }
    admin.php             GET lista / POST cambia estado / POST guarda posiciones del mapa
    carta.php             GET -> categorías + productos + promo vigente + formas de pago
    consumo.php           GET zonas / POST registra el consumo

base de datos/
  non_stop.sql            esquema v4 + datos (CREATE DATABASE non_stop)

instalar_xampp.bat        copia Frontend a C:\xampp\htdocs\non_stop e importa el SQL
```

## Cómo correrlo (XAMPP)

1. Abrí **XAMPP Control Panel** y encendé **Apache** + **MySQL**.
2. Creá `Frontend/api/config.local.php` copiando `config.example.php` y completá
   la contraseña de MySQL y una clave admin larga.
3. Doble click en `instalar_xampp.bat` (o manual):
   - Copiar `Frontend/*` a `C:\xampp\htdocs\non_stop\`
   - En phpMyAdmin (`http://localhost/phpmyadmin`) importar `base de datos/non_stop.sql`
4. Abrí `http://localhost/non_stop/` (la portada). El mapa está en `.../index.html`,
   la carta en `.../carta.html`, el consumo en `.../consumo.html` y el admin en
   `.../admin.html`.

Ojo: `non_stop.sql` usa `CREATE TABLE` sin `IF NOT EXISTS`. Importarlo sobre una base
ya cargada tira `ERROR 1050 Table already exists` pero **no borra nada**; si querés
empezar de cero, primero `DROP DATABASE non_stop;` en phpMyAdmin.

Alternativa sin Apache (igual necesita MySQL encendido):

```bash
cd "Sitio web de Non Stop/Frontend"
"C:\xampp\php\php.exe" -S 127.0.0.1:8081
```

Abrir `http://127.0.0.1:8081/`. Si servís con `python -m http.server`, el PHP no
corre: el badge XAMPP queda en rojo y las reservas no se guardan (solo Instagram).

## Cuentas de usuario (opcionales)

- **Registro**: nombre completo + correo + contraseña (mínimo 8 caracteres).
- **Login**: correo + contraseña. La contraseña se guarda con `password_hash()`
  (bcrypt) y se valida con `password_verify()`; nunca en texto plano.
- **Continuar sin cuenta**: no crea usuario y muestra el mensaje patrocinador de
  Non Stop. Reservar y sacar consumo siguen funcionando sin cuenta.
- La sesión dura **30 días** (cookie `NS_SESION`, HttpOnly, SameSite=Lax) y se
  regenera el ID al entrar.
- Si hay sesión, la portada saluda con el nombre de la cuenta y los formularios de
  reserva/consumo precargan el nombre.
- `reservas.usuario_id` y `consumos.usuario_id` quedan en `NULL` cuando la persona
  navega sin cuenta.
- Límite de intentos: login 8 fallos / 15 min, registro 5 / hora, reservas y
  consumos 6 / 10 min por IP o correo.

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
- **Validaciones**: solo viernes/sábado, desde hoy y hasta un año, sin `<>` en nombre
  o contacto, y límite de intentos por IP/cuenta.
- **Anti desync**: la fuente es MySQL (`api/mesas.php`). `data.js` es solo fallback.
- **Modo edición ⚙**: botón en el header. Elegís una mesa, clickeás el mapa para
  moverla, "Copiar JSON" (para `data.js`) o "Guardar en DB" (pide clave admin y hace
  `UPDATE mesas SET pos_x/pos_y`).
- **Admin**: `admin.html` pide la clave y la manda en el header `X-Admin-Key`
  (nunca en la URL). Filtra por estado y confirma/cancela; al cancelar se libera la
  fecha. Muestra también la cuenta asociada, si la hay.

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

## Badge XAMPP

Todas las páginas muestran abajo a la derecha un pequeño cuadrado con el logo XAMPP
y una marca de estado:

- **✓ verde**: PHP y MySQL responden (`api/estado.php`).
- **✕ roja**: no se pudo conectar.

Reemplaza los viejos textos de "Conectando..." / "Modo offline". Se actualiza solo
cada 30 segundos y al volver a la pestaña.

## Configurar

- **Secretos**: `Frontend/api/config.local.php` (ignorado por git) con `DB_PASS` y
  `ADMIN_KEY`. `config.php` solo tiene valores por defecto y carga el local.
- **Admin**: entrar a `admin.html` y pegar la clave de `config.local.php`. La clave
  viaja en el header `X-Admin-Key`, no en la URL, así no queda en los logs.
- Precios/capacidades: se editan en MySQL (`precios`, `sectores`); el frontend los
  lee de la API. `data.js` queda como espejo offline (actualizalo si cambiás precios).
- Carta: `carta_categorias`, `carta_productos`, `promos`, `formas_pago`.
- Consumo: `zonas_consumo` (nombre + `consumo_adicional` + `activo`) y `consumos`.
  Para cambiar el adicional: `UPDATE zonas_consumo SET consumo_adicional = ...`.
- Para abrir/cerrar una zona: `UPDATE zonas_consumo SET activo = TRUE/FALSE`.

## Seguridad aplicada

- Contraseña de MySQL y clave admin fuera del repositorio (`config.local.php`).
- Consultas con prepared statements; whitelists para día/estado/zona.
- Salida del admin escapada en HTML (se corrigió un XSS almacenado).
- Validación de fechas (pasado y +365 días) y rechazo de `<>` en datos de contacto.
- Rate limiting en login, registro, reservas y consumos.
- Sesiones con cookie HttpOnly/SameSite, ID regenerado al entrar.
- `.htaccess`: sin listado de carpetas, bloqueo de `config.local.php`, `.sql`,
  `.log`, `.env` y headers `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy` y CSP.
- Errores de PHP al log, nunca en la respuesta HTTP.
