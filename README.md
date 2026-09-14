# Non Stop · Reservá tu mesa

Sitio web estático para reservar mesas en Non Stop. Muestra un mapa interactivo del salón, con la info de cada mesa (sector, capacidad, precio y consumo mínimo según el día) y un botón para iniciar la reserva por Instagram con el público a cargo.

## Estructura del proyecto

```
Frontend/               sitio web (estático, sin build ni dependencias)
  index.html              estructura de la página
  style.css               estilos (fondo, mapa, panel de info, botones)
  script.js                lógica: hotspots del mapa, selector de día, reserva
  data.js                  datos: mesas, sectores, precios por día
  Mapas-limpio.jpg          imagen del plano usada para el mapa interactivo
  Mapas de mesas de frente.jpeg   foto de referencia del salón

base de datos/
  non_stop.sql             esquema SQL (MySQL/MariaDB) + datos actuales,
                            generado a partir de Frontend/data.js
```

## Cómo probarlo en local

No requiere instalación ni build. Basta con servir la carpeta `Frontend/` como sitio estático, por ejemplo:

```bash
cd Frontend
python -m http.server 8000
```

y abrir `http://localhost:8000` en el navegador. (Abrir `index.html` directo con doble click también funciona, salvo por el `fetch`/clipboard que en algunos navegadores requiere `http://` en vez de `file://`.)

## Cómo funciona

- **Mapa interactivo**: cada mesa es un botón posicionado en porcentaje (`x`, `y`) sobre `Mapas-limpio.jpg`, definido en `data.js` (`POSICIONES`).
- **Precios por día**: cada mesa pertenece a una categoría de precio (Escenario, Backstage, Ultra VIP 1er/2do bloque, Palco, Suite, Platea) con valores distintos para viernes y sábado, definidos en `PRECIOS` dentro de `data.js`. El sector "Gradas" no se vende (se muestra en el mapa pero sin precio ni reserva).
- **Selector de día**: al elegir una mesa vendible, el cliente elige Viernes o Sábado antes de ver el precio/consumo y de poder reservar — así queda claro qué promoción/valor corresponde a cada noche.
- **Reservar mesa**: copia al portapapeles un mensaje con mesa, sector, día y precio, y abre el Instagram del público a cargo para que el cliente lo pegue y envíe.

## Editar mesas y precios

Todo se controla desde `Frontend/data.js`:

- **Posición de una mesa en el mapa**: objeto `POSICIONES`.
- **Precio de una categoría (viernes/sábado)**: objeto `PRECIOS`.
- **A qué categoría de precio pertenece cada sector**: `CATEGORIA_PRECIO_POR_SECTOR` (y `categoriaPrecioDe()` para los casos especiales de Ultra VIP/VIP).
- **Capacidad por sector**: `CAPACIDAD_POR_SECTOR`.
- **Marcar una mesa como reservada**: pasarle `{ estado: "reservada" }` como `overrides` al crearla con `mesa(id, sector, overrides)`.

## Base de datos

`base de datos/non_stop.sql` tiene el esquema relacional (sectores, categorías de precio, precios por día, públicos, mesas y reservas) más los datos actuales del sitio, por si en el futuro se conecta un backend real para manejar reservas. Hoy el sitio funciona sin backend, todo vive en `data.js`.
