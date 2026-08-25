const hotspotsEl = document.getElementById("hotspots");
const mapaEl = document.getElementById("mapa");
const infoMesaEl = document.getElementById("info-mesa");
const infoMesaContentEl = document.getElementById("infoMesaContent");
const calibrarBtn = document.getElementById("calibrarBtn");

let calibrando = false;
let mesaSeleccionada = null;

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
  Corralito: "md",
  Gradas: "md",
  "Balcón Laucha": "md",
  Balcón: "md",
  "VIP Burbuja": "sm",
  "Ultra VIP": "sm",
  VIP: "sm",
};

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

    btn.addEventListener("click", (e) => {
      if (calibrando) return;
      seleccionarMesa(m.id, btn);
    });

    btn.addEventListener("pointerdown", (e) => {
      if (!calibrando) return;
      iniciarDrag(e, btn, m);
    });

    hotspotsEl.appendChild(btn);
  });
}

function seleccionarMesa(id, btn) {
  document
    .querySelectorAll(".hotspot.is-selected")
    .forEach((el) => el.classList.remove("is-selected"));
  btn.classList.add("is-selected");
  mesaSeleccionada = id;
  mostrarInfo(MESAS_BY_ID[id]);
  infoMesaEl.scrollIntoView({ behavior: "smooth", block: "start" });
}

function mostrarInfo(m) {
  const estadoLabel = m.estado === "reservada" ? "Reservada" : "Disponible";
  infoMesaContentEl.innerHTML = `
    <p class="mesa-info__sector">${m.sector}</p>
    <h2 class="mesa-info__titulo">
      Mesa ${m.id}
      <span class="mesa-info__estado mesa-info__estado--${m.estado}">${estadoLabel}</span>
    </h2>
    <div class="mesa-info__grid">
      <div class="mesa-info__dato">
        <span class="mesa-info__dato-label">Capacidad</span>
        <span class="mesa-info__dato-valor">${m.capacidad} personas</span>
      </div>
      <div class="mesa-info__dato">
        <span class="mesa-info__dato-label">Consumo mínimo</span>
        <span class="mesa-info__dato-valor">${formatoARS.format(m.consumo)}</span>
      </div>
      <div class="mesa-info__dato">
        <span class="mesa-info__dato-label">Precio de la mesa</span>
        <span class="mesa-info__dato-valor">${formatoARS.format(m.precio)}</span>
      </div>
    </div>
    <div class="mesa-info__publica">
      <p class="mesa-info__publica-label">Tu público a cargo</p>
      <p class="mesa-info__publica-nombre">${m.publica.nombre}</p>
      <a class="mesa-info__ig" href="https://instagram.com/${m.publica.instagram}" target="_blank" rel="noopener">
        📷 @${m.publica.instagram}
      </a>
    </div>
  `;
}

// --- Modo calibración: arrastrar hotspots sobre la imagen real ---
calibrarBtn.addEventListener("click", () => {
  calibrando = !calibrando;
  calibrarBtn.classList.toggle("is-active", calibrando);
  if (calibrando) {
    mostrarPanelExport();
  } else {
    cerrarExport();
  }
});

function iniciarDrag(e, btn, m) {
  e.preventDefault();
  btn.classList.add("is-dragging");
  const mover = (ev) => {
    const rect = mapaEl.getBoundingClientRect();
    const clientX = ev.clientX ?? ev.touches?.[0]?.clientX;
    const clientY = ev.clientY ?? ev.touches?.[0]?.clientY;
    let x = ((clientX - rect.left) / rect.width) * 100;
    let y = ((clientY - rect.top) / rect.height) * 100;
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));
    m.x = Math.round(x * 100) / 100;
    m.y = Math.round(y * 100) / 100;
    btn.style.left = `${m.x}%`;
    btn.style.top = `${m.y}%`;
    actualizarExport();
  };
  const soltar = () => {
    btn.classList.remove("is-dragging");
    window.removeEventListener("pointermove", mover);
    window.removeEventListener("pointerup", soltar);
  };
  window.addEventListener("pointermove", mover);
  window.addEventListener("pointerup", soltar);
}

let exportBox;
function mostrarPanelExport() {
  exportBox = document.createElement("div");
  exportBox.id = "exportBox";
  exportBox.style.cssText = `
    position: fixed; bottom: 1rem; left: 50%; transform: translateX(-50%);
    background: #0c0c12; border: 1px solid rgba(255,255,255,0.15);
    border-radius: 10px; padding: 1rem; max-width: 90vw; width: 500px;
    z-index: 30; color: #f4f4f8; font-family: monospace; font-size: 0.75rem;
  `;
  exportBox.innerHTML = `
    <p style="margin:0 0 0.5rem;font-family:Segoe UI, sans-serif;">
      Modo edición: arrastrá cada número a su lugar. Cuando termines, copiá el JSON y pasámelo.
    </p>
    <textarea id="exportText" readonly style="width:100%;height:120px;background:#050507;color:#f4f4f8;border:1px solid rgba(255,255,255,0.15);border-radius:6px;"></textarea>
    <button id="copiarBtn" style="margin-top:0.5rem;">Copiar JSON</button>
  `;
  document.body.appendChild(exportBox);
  actualizarExport();
  document.getElementById("copiarBtn").addEventListener("click", () => {
    const text = document.getElementById("exportText").value;
    navigator.clipboard.writeText(text);
  });
}

function actualizarExport() {
  const ta = document.getElementById("exportText");
  if (!ta) return;
  const coords = MESAS.map((m) => ({ id: m.id, x: m.x, y: m.y }));
  ta.value = JSON.stringify(coords, null, 1);
}

function cerrarExport() {
  exportBox?.remove();
  exportBox = null;
}

renderHotspots();
