const hotspotsEl = document.getElementById("hotspots");
const infoMesaEl = document.getElementById("info-mesa");
const infoMesaContentEl = document.getElementById("infoMesaContent");
const apiStatusEl = document.getElementById("apiStatus");
const btnEdit = document.getElementById("btnEdit");
const mapaEl = document.getElementById("mapa");

const formatoARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const SECTOR_TAMANO = {
  Escenario: "lg",
  Platea: "lg",
  "VIP Suite": "md-lg",
  Gradas: "md",
  "Balcón Tincho": "md",
  "Balcón Canepa": "md",
  "VIP Burbuja": "sm",
  "Ultra VIP": "sm",
  VIP: "sm",
};

let diaSeleccionado = null;
let mesaActual = null;
let FECHAS = { hoy: null, viernes: null, sabado: null };
let API_OK = false;
let editMode = false;

function fechaLinda(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const meses = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  return `${d} ${meses[m - 1]}`;
}

function setStatus(msg, mode) {
  if (!apiStatusEl) return;
  apiStatusEl.textContent = msg;
  apiStatusEl.className = "api-status" + (mode ? ` api-status--${mode}` : "");
}

async function apiGet(url) {
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

async function cargarFechas() {
  try {
    const d = await apiGet("api/fechas.php");
    if (d.ok) {
      FECHAS = { hoy: d.hoy, viernes: d.viernes, sabado: d.sabado };
      API_OK = true;
      return true;
    }
  } catch (e) {
    const hoy = new Date();
    const target = (dow) => {
      const diff = (dow - hoy.getDay() + 7) % 7;
      const f = new Date(hoy);
      f.setDate(hoy.getDate() + diff);
      return f.toISOString().slice(0, 10);
    };
    FECHAS = { hoy: hoy.toISOString().slice(0, 10), viernes: target(5), sabado: target(6) };
    API_OK = false;
  }
  return false;
}

async function cargarMesas(dia) {
  if (!dia) {
    try {
      await apiGet("api/fechas.php");
      API_OK = true;
      setStatus("Disponibilidad en vivo ●", "ok");
    } catch (e) {
      API_OK = false;
      setStatus("Modo offline: sin conexión a la base (mostrando precios base)", "off");
    }
    renderHotspots();
    return;
  }
  const fecha = FECHAS[dia];
  try {
    const d = await apiGet(`api/mesas.php?dia=${dia}&fecha=${fecha}`);
    if (d.ok) {
      API_OK = true;
      FECHAS = d.fechas || FECHAS;
      for (const m of d.mesas) {
        const local = MESAS_BY_ID[m.id];
        if (local) {
          local.estado = m.estado;
          local.disponibleFecha = m.disponible;
          local.precioApi = m.precioInfo;
        }
      }
      setStatus(`Disponibilidad en vivo ● ${dia === "viernes" ? "Viernes" : "Sábado"} ${fechaLinda(fecha)}`, "ok");
    }
  } catch (e) {
    API_OK = false;
    setStatus("Modo offline: no se pudo leer disponibilidad, precios base", "off");
  }
  renderHotspots();
  if (mesaActual) {
    const el = hotspotsEl.querySelector(`[data-id="${mesaActual.id}"]`);
    if (el) el.classList.add("is-selected");
  }
}

function precioEfectivo(m, dia) {
  if (m.precioApi && diaSeleccionado) return m.precioApi;
  if (typeof getPrecio === "function" && dia) return getPrecio(m, dia);
  return null;
}

function disponibleEfectivo(m) {
  if (typeof m.disponibleFecha === "boolean" && diaSeleccionado && API_OK) {
    return m.disponibleFecha && m.estado !== "reservada";
  }
  return m.estado !== "reservada";
}

function renderHotspots() {
  hotspotsEl.innerHTML = "";
  MESAS.forEach((m) => {
    const bloqueada = !disponibleEfectivo(m) && m.vendible;
    const btn = document.createElement("button");
    btn.className = `hotspot hotspot--${SECTOR_TAMANO[m.sector] || "md"}`;
    if (m.estado === "reservada" || bloqueada) btn.classList.add("is-reservada");
    if (editMode) btn.classList.add("is-editable");
    btn.style.left = `${m.x}%`;
    btn.style.top = `${m.y}%`;
    btn.textContent = m.id;
    btn.dataset.id = m.id;
    btn.setAttribute("aria-label", `Mesa ${m.id}`);
    btn.title = `Mesa ${m.id} · ${m.sector}`;

    btn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      seleccionarMesa(m.id, btn);
    });

    hotspotsEl.appendChild(btn);
  });
}

function seleccionarMesa(id, btn) {
  document
    .querySelectorAll(".hotspot.is-selected")
    .forEach((el) => el.classList.remove("is-selected"));
  btn.classList.add("is-selected");
  mesaActual = MESAS_BY_ID[id];
  mostrarInfo(mesaActual);
  infoMesaEl.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function elegirDia(dia) {
  diaSeleccionado = dia;
  await cargarMesas(dia);
  if (mesaActual) mostrarInfo(mesaActual);
}

function mensajeReservaLocal(m, precioInfo) {
  const diaLabel = diaSeleccionado === "viernes" ? "viernes" : "sábado";
  const fecha = FECHAS[diaSeleccionado] ? ` ${fechaLinda(FECHAS[diaSeleccionado])}` : "";
  const detalle = precioInfo.full
    ? `${formatoARS.format(precioInfo.precio)} full`
    : `${formatoARS.format(precioInfo.precio)} de mesa con ${formatoARS.format(precioInfo.consumo)} de consumo`;
  return `Hola! Quiero reservar la mesa ${m.id} (${m.sector}) para el ${diaLabel}${fecha}. Vi que sale ${detalle}.`;
}

async function reservarMesa() {
  if (!mesaActual || !diaSeleccionado) return;
  const nombreEl = document.getElementById("resNombre");
  const contactoEl = document.getElementById("resContacto");
  const aviso = document.getElementById("reservaAviso");
  const nombre = (nombreEl?.value || "").trim();
  const contacto = (contactoEl?.value || "").trim();

  if (nombre.length < 2) {
    if (aviso) { aviso.hidden = false; aviso.textContent = "Escribí tu nombre para reservar."; }
    nombreEl?.focus();
    return;
  }
  if (contacto.length < 3) {
    if (aviso) { aviso.hidden = false; aviso.textContent = "Dejanos un contacto (celu o Instagram)."; }
    contactoEl?.focus();
    return;
  }

  const btn = document.getElementById("btnReservar");
  if (btn) { btn.disabled = true; btn.textContent = "Guardando..."; }

  const fecha_evento = FECHAS[diaSeleccionado];
  const payload = {
    mesa_id: mesaActual.id,
    dia: diaSeleccionado,
    fecha_evento,
    cliente_nombre: nombre,
    cliente_contacto: contacto,
  };

  try {
    const r = await fetch("api/reservar.php", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    const d = await r.json();
    if (!r.ok || !d.ok) throw new Error(d.error || `HTTP ${r.status}`);

    try {
      await navigator.clipboard.writeText(d.mensaje);
    } catch (e) {}
    if (aviso) {
      aviso.hidden = false;
      aviso.textContent = `¡Reserva #${d.reserva_id} guardada! Se copió el mensaje, pegalo en Instagram.`;
    }
    mesaActual.estado = "reservada";
    mesaActual.disponibleFecha = false;
    renderHotspots();
    mostrarInfo(mesaActual);
    window.open(d.instagram_url, "_blank", "noopener");
    return;
  } catch (e) {
    if (!API_OK) {
      const precioInfo = precioEfectivo(mesaActual, diaSeleccionado);
      const mensaje = mensajeReservaLocal(mesaActual, precioInfo);
      try { await navigator.clipboard.writeText(mensaje); } catch (err) {}
      if (aviso) {
        aviso.hidden = false;
        aviso.textContent = "Sin conexión a la base: no se guardó, pero te abrimos Instagram igual.";
      }
      window.open(`https://instagram.com/${mesaActual.publica.instagram}`, "_blank", "noopener");
      if (btn) { btn.disabled = false; btn.textContent = "Reservar mesa"; }
      return;
    }
    if (aviso) { aviso.hidden = false; aviso.textContent = `No se pudo reservar: ${e.message}`; }
    if (btn) { btn.disabled = false; btn.textContent = "Reservar mesa"; }
    await cargarMesas(diaSeleccionado);
    if (mesaActual) mostrarInfo(mesaActual);
  }
}

function mostrarInfo(m) {
  const reservada = !disponibleEfectivo(m) && m.vendible;
  const estadoLabel = reservada ? "Reservada" : "Disponible";
  const estadoCls = reservada ? "reservada" : "disponible";

  if (!m.vendible) {
    infoMesaContentEl.innerHTML = `
      <p class="mesa-info__sector">${m.sector}</p>
      <h2 class="mesa-info__titulo">Mesa ${m.id}</h2>
      <p class="mesa-info__no-vendible">Este sector no está disponible para reservar. Consultá con nuestro público en el lugar.</p>
      <div class="mesa-info__publica">
        <p class="mesa-info__publica-label">Tu público a cargo</p>
        <p class="mesa-info__publica-nombre">${m.publica.nombre}</p>
        <a class="mesa-info__ig" href="https://instagram.com/${m.publica.instagram}" target="_blank" rel="noopener">
          📷 @${m.publica.instagram}
        </a>
      </div>
    `;
    return;
  }

  const precioInfo = diaSeleccionado ? precioEfectivo(m, diaSeleccionado) : null;
  const puedeReservar = !reservada && !!precioInfo;
  const fechaTxt = diaSeleccionado && FECHAS[diaSeleccionado]
    ? ` · ${diaSeleccionado === "viernes" ? "Viernes" : "Sábado"} ${fechaLinda(FECHAS[diaSeleccionado])}`
    : "";

  const preciosHtml = precioInfo
    ? `
      <div class="mesa-info__dato">
        <span class="mesa-info__dato-label">Capacidad</span>
        <span class="mesa-info__dato-valor">${m.capacidad} personas</span>
      </div>
      ${
        precioInfo.full
          ? `
      <div class="mesa-info__dato">
        <span class="mesa-info__dato-label">Precio (todo incluido)${fechaTxt}</span>
        <span class="mesa-info__dato-valor">${formatoARS.format(precioInfo.precio)}</span>
      </div>`
          : `
      <div class="mesa-info__dato">
        <span class="mesa-info__dato-label">Consumo mínimo${fechaTxt}</span>
        <span class="mesa-info__dato-valor">${formatoARS.format(precioInfo.consumo)}</span>
      </div>
      <div class="mesa-info__dato">
        <span class="mesa-info__dato-label">Precio de la mesa${fechaTxt}</span>
        <span class="mesa-info__dato-valor">${formatoARS.format(precioInfo.precio)}</span>
      </div>`
      }
    `
    : `
      <div class="mesa-info__dato">
        <span class="mesa-info__dato-label">Capacidad</span>
        <span class="mesa-info__dato-valor">${m.capacidad} personas</span>
      </div>
      <div class="mesa-info__dato mesa-info__dato--placeholder">
        <span class="mesa-info__dato-valor">Elegí un día para ver el precio</span>
      </div>
    `;

  infoMesaContentEl.innerHTML = `
    <p class="mesa-info__sector">${m.sector}</p>
    <h2 class="mesa-info__titulo">
      Mesa ${m.id}
      <span class="mesa-info__estado mesa-info__estado--${estadoCls}">${estadoLabel}</span>
    </h2>

    <div class="dia-selector">
      <span class="dia-selector__label">Elegí el día:</span>
      <div class="dia-selector__botones">
        <button type="button" class="dia-btn ${diaSeleccionado === "viernes" ? "is-selected" : ""}" data-dia="viernes">
          Viernes${FECHAS.viernes ? ` ${fechaLinda(FECHAS.viernes)}` : ""}
        </button>
        <button type="button" class="dia-btn ${diaSeleccionado === "sabado" ? "is-selected" : ""}" data-dia="sabado">
          Sábado${FECHAS.sabado ? ` ${fechaLinda(FECHAS.sabado)}` : ""}
        </button>
      </div>
    </div>

    <div class="mesa-info__grid">
      ${preciosHtml}
    </div>

    <div class="mesa-info__publica">
      <p class="mesa-info__publica-label">Tu público a cargo</p>
      <p class="mesa-info__publica-nombre">${m.publica.nombre}</p>
      <a class="mesa-info__ig" href="https://instagram.com/${m.publica.instagram}" target="_blank" rel="noopener">
        📷 @${m.publica.instagram}
      </a>
    </div>

    <div class="res-form">
      <label class="res-form__label" for="resNombre">Tu nombre</label>
      <input class="res-form__input" id="resNombre" type="text" maxlength="100" placeholder="Ej: Alexis" autocomplete="name" />
      <label class="res-form__label" for="resContacto">Tu contacto (celu o Instagram)</label>
      <input class="res-form__input" id="resContacto" type="text" maxlength="100" placeholder="Ej: 11 1234 5678 / @usuario" autocomplete="tel" />
    </div>

    <button type="button" id="btnReservar" class="btn-reservar" ${puedeReservar ? "" : "disabled"}>
      ${reservada ? "Mesa ya reservada para esa fecha" : "Reservar mesa"}
    </button>
    <p id="reservaAviso" class="reserva-aviso" hidden></p>
    ${API_OK ? "" : `<p class="reserva-aviso reserva-aviso--off">Sin conexión a la base: la reserva solo abrirá Instagram.</p>`}
  `;

  infoMesaContentEl.querySelectorAll(".dia-btn").forEach((b) => {
    b.addEventListener("click", () => elegirDia(b.dataset.dia));
  });

  const btnReservar = document.getElementById("btnReservar");
  if (btnReservar && puedeReservar) {
    btnReservar.addEventListener("click", reservarMesa);
  }
}

function setEditMode(on) {
  editMode = on;
  document.body.classList.toggle("edit-mode", on);
  if (btnEdit) btnEdit.textContent = on ? "✔ Terminar edición" : "⚙ Editar mapa";
  renderHotspots();
  if (on && !mesaActual) {
    setStatus("Modo edición: elegí una mesa y luego hacé click en el mapa para moverla", "");
  }
}

function exportPosiciones() {
  const obj = {};
  for (const m of MESAS) obj[m.id] = [Number(m.x.toFixed(2)), Number(m.y.toFixed(2))];
  return JSON.stringify(obj);
}

if (btnEdit) {
  btnEdit.addEventListener("click", () => {
    if (!editMode) {
      setEditMode(true);
      if (!document.getElementById("editBar")) {
        const bar = document.createElement("div");
        bar.id = "editBar";
        bar.className = "edit-bar";
        bar.innerHTML = `
          <span>Elegí una mesa y clickeá el mapa para moverla.</span>
          <button type="button" id="btnExportPos" class="tool-btn">Copiar JSON</button>
          <button type="button" id="btnSavePos" class="tool-btn">Guardar en DB</button>
        `;
        mapaEl.after(bar);
        document.getElementById("btnExportPos").addEventListener("click", async () => {
          try {
            await navigator.clipboard.writeText(`const POSICIONES = ${exportPosiciones()};`);
            alert("JSON copiado. Pegalo en Frontend/data.js como POSICIONES.");
          } catch (e) {
            prompt("Copiá este JSON en data.js:", exportPosiciones());
          }
        });
        document.getElementById("btnSavePos").addEventListener("click", async () => {
          const key = prompt("Clave admin para guardar posiciones en MySQL:");
          if (!key) return;
          try {
            const pos = {};
            for (const m of MESAS) pos[m.id] = [m.x, m.y];
            const r = await fetch("api/admin.php", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ key, action: "posiciones", posiciones: pos }),
            });
            const d = await r.json();
            if (!d.ok) throw new Error(d.error || "Error");
            alert(`Guardadas ${d.actualizadas} posiciones en MySQL.`);
          } catch (e) {
            alert(`No se pudo guardar: ${e.message}`);
          }
        });
      }
    } else {
      setEditMode(false);
      document.getElementById("editBar")?.remove();
      cargarMesas(diaSeleccionado);
    }
  });
}

if (mapaEl) {
  mapaEl.addEventListener("click", (ev) => {
    if (!editMode || !mesaActual) return;
    if (ev.target.closest(".hotspot")) return;
    const rect = mapaEl.getBoundingClientRect();
    const x = ((ev.clientX - rect.left) / rect.width) * 100;
    const y = ((ev.clientY - rect.top) / rect.height) * 100;
    mesaActual.x = Math.min(100, Math.max(0, x));
    mesaActual.y = Math.min(100, Math.max(0, y));
    renderHotspots();
    const el = hotspotsEl.querySelector(`[data-id="${mesaActual.id}"]`);
    if (el) el.classList.add("is-selected");
  });
}

(async function init() {
  renderHotspots();
  await cargarFechas();
  await cargarMesas(null);
})();
