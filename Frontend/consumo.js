// "Salir - Consumo": elegis zona + personas + monto, y se registra.
// El adicional de la zona lo calcula y guarda el servidor (nunca el cliente).
// No hay pago online: se copia el mensaje y se abre Instagram para coordinar.

const formatoARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const statusEl = document.getElementById("apiStatus");
const zonasEl = document.getElementById("listaZonas");
const personasEl = document.getElementById("personas");
const consumoEl = document.getElementById("consumo");
const nombreEl = document.getElementById("nombre");
const contactoEl = document.getElementById("contacto");
const resumenEl = document.getElementById("resumen");
const avisoEl = document.getElementById("aviso");
const btnEl = document.getElementById("btnEnviar");
const pagosEl = document.getElementById("formasPago");
const reglaEl = document.getElementById("reglaMax");
const formEl = document.getElementById("formConsumo");

let ZONAS = [];
let MAX_PERSONAS = 6;

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function zonaElegida() {
  const marcado = document.querySelector('input[name="zona_id"]:checked');
  if (!marcado) return null;
  return ZONAS.find((z) => z.id === Number(marcado.value)) || null;
}

// Limpia "80000", "80.000", "$ 80.000" -> 80000
function parseMonto(txt) {
  const limpio = String(txt).replace(/[^\d]/g, "");
  return limpio === "" ? 0 : Number(limpio);
}

// Pinta el resumen en vivo mientras se completa el formulario.
function refrescarResumen() {
  const zona = zonaElegida();
  const base = parseMonto(consumoEl.value);
  if (!zona || base <= 0) {
    resumenEl.hidden = true;
    return;
  }
  const adicional = zona.consumo_adicional || 0;
  document.getElementById("rBase").textContent = formatoARS.format(base);
  document.getElementById("rAdicional").textContent = adicional > 0 ? formatoARS.format(adicional) : "Sin adicional";
  document.getElementById("rTotal").textContent = formatoARS.format(base + adicional);
  resumenEl.hidden = false;
}

function mostrarAviso(texto, tipo) {
  avisoEl.textContent = texto;
  avisoEl.className = "aviso" + (tipo ? ` aviso--${tipo}` : "");
  avisoEl.hidden = false;
}

function pintarZonas() {
  zonasEl.innerHTML = ZONAS.map((z) => `
    <label class="zona">
      <input type="radio" name="zona_id" value="${z.id}" />
      <span class="zona__body">
        <span class="zona__nombre">${esc(z.nombre)}</span>
        <span class="zona__extra">${
          z.consumo_adicional > 0
            ? `+ ${formatoARS.format(z.consumo_adicional)} de adicional`
            : "Sin adicional"
        }</span>
        ${z.descripcion ? `<span class="zona__desc">${esc(z.descripcion)}</span>` : ""}
      </span>
    </label>`).join("");

  zonasEl.querySelectorAll('input[name="zona_id"]').forEach((r) => {
    r.addEventListener("change", refrescarResumen);
  });
}

function pintarPersonas() {
  let html = "";
  for (let i = 1; i <= MAX_PERSONAS; i++) {
    html += `<option value="${i}">${i} ${i === 1 ? "persona" : "personas"}</option>`;
  }
  personasEl.innerHTML = html;
}

function pintarPagos(formas) {
  pagosEl.innerHTML = (formas || [])
    .map((f) => `
      <li class="pagos__item">
        <span class="pagos__nombre">${esc(f.nombre)}</span>
        ${f.detalle ? `<span class="pagos__detalle">${esc(f.detalle)}</span>` : ""}
      </li>`)
    .join("");
}

async function cargar() {
  try {
    const r = await fetch("api/consumo.php", { headers: { Accept: "application/json" } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();
    if (!d.ok) throw new Error(d.error || "respuesta invalida");

    ZONAS = d.zonas;
    MAX_PERSONAS = d.max_personas || 6;

    pintarZonas();
    pintarPersonas();
    pintarPagos(d.formas_pago);
    reglaEl.textContent = `Máximo ${MAX_PERSONAS} personas por consumo. No se aceptan grupos más grandes.`;

    statusEl.textContent = `${ZONAS.length} zonas disponibles`;
    statusEl.className = "api-status api-status--ok";
  } catch (e) {
    statusEl.textContent = `No se pudieron cargar las zonas: ${e.message}`;
    statusEl.className = "api-status api-status--off";
    btnEl.disabled = true;
  }
}

consumoEl.addEventListener("input", refrescarResumen);

formEl.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  avisoEl.hidden = true;

  const zona = zonaElegida();
  if (!zona) return mostrarAviso("Elegí una zona", "error");
  if (!nombreEl.value.trim()) { mostrarAviso("Decinos tu nombre", "error"); return nombreEl.focus(); }
  if (!contactoEl.value.trim()) { mostrarAviso("Dejanos un contacto", "error"); return contactoEl.focus(); }

  const payload = {
    zona_id: zona.id,
    personas: Number(personasEl.value),
    consumo_base: parseMonto(consumoEl.value),
    persona_nombre: nombreEl.value.trim(),
    persona_contacto: contactoEl.value.trim(),
  };
  if (payload.consumo_base <= 0) {
    return mostrarAviso("Escribí el consumo que querés sacar", "error"), consumoEl.focus();
  }

  btnEl.disabled = true;
  btnEl.textContent = "Guardando...";

  try {
    const r = await fetch("api/consumo.php", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    const d = await r.json();
    if (!r.ok || !d.ok) throw new Error(d.error || `HTTP ${r.status}`);

    try { await navigator.clipboard.writeText(d.mensaje); } catch (e) {}

    mostrarAviso(
      `¡Consumo #${d.consumo_id} anotado! Total ${formatoARS.format(d.total)}. ` +
      `Se copió el mensaje, pegalo en Instagram para coordinar.`,
      "ok"
    );
    formEl.reset();
    resumenEl.hidden = true;
    window.open(d.instagram_url, "_blank", "noopener");
  } catch (e) {
    mostrarAviso(`No se pudo guardar: ${e.message}`, "error");
  } finally {
    btnEl.disabled = false;
    btnEl.textContent = "Sacar consumo";
  }
});

cargar();