const hotspotsEl = document.getElementById("hotspots");
const infoMesaEl = document.getElementById("info-mesa");
const infoMesaContentEl = document.getElementById("infoMesaContent");

const formatoARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

// tamaño relativo del número inspirado en las burbujas del mapa original:
// Platea/Escenario son las más grandes, VIP Burbuja/Ultra VIP/bloque central las más chicas.
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

// día elegido por el cliente, se mantiene mientras navega otras mesas
let diaSeleccionado = null; // "viernes" | "sabado" | null
let mesaActual = null;

function renderHotspots() {
  hotspotsEl.innerHTML = "";
  MESAS.forEach((m) => {
    const btn = document.createElement("button");
    btn.className = `hotspot hotspot--${SECTOR_TAMANO[m.sector] || "md"}`;
    if (m.estado === "reservada") btn.classList.add("is-reservada");
    btn.style.left = `${m.x}%`;
    btn.style.top = `${m.y}%`;
    btn.textContent = m.id;
    btn.dataset.id = m.id;
    btn.setAttribute("aria-label", `Mesa ${m.id}`);
    btn.title = `Mesa ${m.id}`;

    btn.addEventListener("click", () => seleccionarMesa(m.id, btn));

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

function elegirDia(dia) {
  diaSeleccionado = dia;
  if (mesaActual) mostrarInfo(mesaActual);
}

function mensajeReserva(m, precioInfo) {
  const diaLabel = diaSeleccionado === "viernes" ? "viernes" : "sábado";
  const detalle = precioInfo.full
    ? `${formatoARS.format(precioInfo.precio)} full`
    : `${formatoARS.format(precioInfo.precio)} de mesa con ${formatoARS.format(precioInfo.consumo)} de consumo`;
  return `Hola! Quiero reservar la mesa ${m.id} (${m.sector}) para el ${diaLabel}. Vi que sale ${detalle}.`;
}

async function reservarMesa() {
  if (!mesaActual || !diaSeleccionado) return;
  const precioInfo = getPrecio(mesaActual, diaSeleccionado);
  if (!precioInfo) return;
  const mensaje = mensajeReserva(mesaActual, precioInfo);
  try {
    await navigator.clipboard.writeText(mensaje);
    const aviso = document.getElementById("reservaAviso");
    if (aviso) {
      aviso.textContent = "¡Mensaje copiado! Pegalo en el chat de Instagram.";
      aviso.hidden = false;
    }
  } catch (e) {
    // si falla el portapapeles (permisos del navegador), igual abrimos Instagram
  }
  window.open(`https://instagram.com/${mesaActual.publica.instagram}`, "_blank", "noopener");
}

function mostrarInfo(m) {
  const estadoLabel = m.estado === "reservada" ? "Reservada" : "Disponible";

  if (!m.vendible) {
    infoMesaContentEl.innerHTML = `
      <p class="mesa-info__sector">${m.sector}</p>
      <h2 class="mesa-info__titulo">
        Mesa ${m.id}
      </h2>
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

  const precioInfo = diaSeleccionado ? getPrecio(m, diaSeleccionado) : null;
  const puedeReservar = m.estado !== "reservada" && !!precioInfo;

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
        <span class="mesa-info__dato-label">Precio (todo incluido)</span>
        <span class="mesa-info__dato-valor">${formatoARS.format(precioInfo.precio)}</span>
      </div>`
          : `
      <div class="mesa-info__dato">
        <span class="mesa-info__dato-label">Consumo mínimo</span>
        <span class="mesa-info__dato-valor">${formatoARS.format(precioInfo.consumo)}</span>
      </div>
      <div class="mesa-info__dato">
        <span class="mesa-info__dato-label">Precio de la mesa</span>
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
      <span class="mesa-info__estado mesa-info__estado--${m.estado}">${estadoLabel}</span>
    </h2>

    <div class="dia-selector">
      <span class="dia-selector__label">Elegí el día:</span>
      <div class="dia-selector__botones">
        <button type="button" class="dia-btn ${diaSeleccionado === "viernes" ? "is-selected" : ""}" data-dia="viernes">Viernes</button>
        <button type="button" class="dia-btn ${diaSeleccionado === "sabado" ? "is-selected" : ""}" data-dia="sabado">Sábado</button>
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

    <button type="button" id="btnReservar" class="btn-reservar" ${puedeReservar ? "" : "disabled"}>
      ${m.estado === "reservada" ? "Mesa ya reservada" : "Reservar mesa"}
    </button>
    <p id="reservaAviso" class="reserva-aviso" hidden></p>
  `;

  infoMesaContentEl.querySelectorAll(".dia-btn").forEach((btn) => {
    btn.addEventListener("click", () => elegirDia(btn.dataset.dia));
  });

  const btnReservar = document.getElementById("btnReservar");
  if (btnReservar && puedeReservar) {
    btnReservar.addEventListener("click", reservarMesa);
  }
}

renderHotspots();
