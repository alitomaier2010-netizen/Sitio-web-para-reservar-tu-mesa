// Carta de barra. Los precios salen de MySQL via api/carta.php.
// Maquetado con el formato del boceto: dos columnas de categorias,
// cada fila con P.L (precio lista) y Desc. Efect. (precio efectivo).

const formatoARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const statusEl = document.getElementById("apiStatus");
const colIzqEl = document.getElementById("colIzq");
const colDerEl = document.getElementById("colDer");
const promosEl = document.getElementById("promos");
const pagosEl = document.getElementById("formasPago");

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function precio(v) {
  return v === null || v === undefined ? "&mdash;" : formatoARS.format(v);
}

// Fila de producto: nombre | P.L | Desc. Efect.
function filaProducto(p) {
  return `
    <li class="carta__item">
      <span class="carta__nombre">${esc(p.nombre)}</span>
      <span class="carta__pl">${precio(p.precio_lista)}</span>
      <span class="carta__desc">${precio(p.precio_efectivo)}</span>
    </li>`;
}

// Bloque de una categoría, con su nota entre paréntesis si tiene.
function bloqueCategoria(c) {
  const nota = c.nota ? `<span class="carta__nota">(${esc(c.nota)})</span>` : "";
  const clase = c.es_caja ? "carta__caja" : "";
  return `
    <section class="carta__cat ${clase}">
      <h2 class="carta__cat-titulo">
        ${esc(c.nombre)}${nota}
      </h2>
      <div class="carta__cols-head">
        <span></span><span class="carta__pl">P.L</span><span class="carta__desc">Desc. Efect.</span>
      </div>
      <ul class="carta__items">${c.productos.map(filaProducto).join("")}</ul>
    </section>`;
}

// Promo del día: va destacada arriba, como en el boceto.
function bloquePromo(p) {
  return `
    <article class="promo">
      <h3 class="promo__titulo">${esc(p.titulo)}</h3>
      <p class="promo__precios">
        <span class="promo__pl">Regular P.L. ${precio(p.precio_lista)}</span>
        <span class="promo__desc">Desc. Efect. ${precio(p.precio_efectivo)}</span>
      </p>
      ${p.detalle ? `<p class="promo__detalle">${esc(p.detalle)}</p>` : ""}
    </article>`;
}

function render(d) {
  const izq = d.categorias.filter((c) => c.columna === "izq");
  const der = d.categorias.filter((c) => c.columna === "der");

  colIzqEl.innerHTML = izq.map(bloqueCategoria).join("");
  colDerEl.innerHTML = der.map(bloqueCategoria).join("");

  if (d.promos && d.promos.length) {
    promosEl.innerHTML = d.promos.map(bloquePromo).join("");
    promosEl.hidden = false;
  }

  pagosEl.innerHTML = (d.formas_pago || [])
    .map((f) => `
      <li class="pagos__item">
        <span class="pagos__nombre">${esc(f.nombre)}</span>
        ${f.detalle ? `<span class="pagos__detalle">${esc(f.detalle)}</span>` : ""}
      </li>`)
    .join("");
}

async function cargar() {
  try {
    const r = await fetch("api/carta.php", { headers: { Accept: "application/json" } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();
    if (!d.ok) throw new Error(d.error || "respuesta invalida");
    render(d);
    statusEl.textContent = "Carta actualizada";
    statusEl.className = "api-status api-status--ok";
  } catch (e) {
    colIzqEl.innerHTML = "";
    colDerEl.innerHTML = "";
    pagosEl.innerHTML = "";
    statusEl.textContent = `No se pudo cargar la carta: ${e.message}`;
    statusEl.className = "api-status api-status--off";
  }
}

cargar();